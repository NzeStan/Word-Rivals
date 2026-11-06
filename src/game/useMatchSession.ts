import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Matches } from '@/api/endpoints';
import { ApiError } from '@/api/http';
import type { EventEnvelope, Match } from '@/api/types';
import { GameSocket, type SocketStatus } from '@/realtime/socket';
import { feedback } from '@/state/feedback';
import { queryClient } from '@/state/session';
import { initialView, matchReducer } from './reducer';

export type MoveOutcome = { ok: true } | { ok: false; code: string; message: string };
export type LiveReaction = { id: number; seat: number; key: string };

const MOVE_REPLY_TIMEOUT_MS = 6000;

export function useMatchSession(matchId: string) {
  const [view, dispatch] = useReducer(matchReducer, initialView);
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [gone, setGone] = useState(false);
  const [reaction, setReaction] = useState<LiveReaction | null>(null);

  const socket = useRef<GameSocket | null>(null);
  const pending = useRef(new Map<string, (outcome: MoveOutcome) => void>());
  const mySeat = useRef<number | null>(null);
  const reactionId = useRef(0);

  const refetch = useCallback(async () => {
    const [match, moves] = await Promise.all([Matches.get(matchId), Matches.moves(matchId)]);
    mySeat.current = match.my_seat;
    dispatch({ type: 'snapshot', match, now: Date.now() });
    dispatch({ type: 'moves', moves });
  }, [matchId]);

  const onEvent = useCallback((event: EventEnvelope) => {
    const d = event.data ?? {};
    switch (event.type) {
      case 'move.accepted':
        if (d.seat !== mySeat.current) feedback.opponentMove();
        break;
      case 'turn.started':
        if (d.seat === mySeat.current) feedback.yourTurn();
        break;
      case 'timer.warning':
        if (d.seat === mySeat.current) feedback.tick();
        break;
      case 'match.completed':
        if (d.winner_seat === mySeat.current) feedback.win();
        else if (mySeat.current !== null) feedback.lose();
        void queryClient.invalidateQueries({ queryKey: ['matches'] });
        break;
      case 'player.reaction':
        setReaction({ id: ++reactionId.current, seat: d.seat, key: d.key });
        return;
    }
    dispatch({ type: 'event', event, now: Date.now() });
  }, []);

  useEffect(() => {
    const client = new GameSocket(`matches/${matchId}/`, {
      onStatus: setStatus,
      onFatal: () => setGone(true),
      onMessage: (m) => {
        switch (m.type) {
          case 'session.welcome': {
            const match = m.data as Match;
            mySeat.current = match.my_seat;
            dispatch({ type: 'snapshot', match, now: Date.now() });
            // The welcome skips anything missed while away, so the move list is reloaded.
            Matches.moves(matchId)
              .then((moves) => dispatch({ type: 'moves', moves }))
              .catch(() => {});
            break;
          }
          case 'move.result': {
            const resolve = pending.current.get(m.request_id);
            pending.current.delete(m.request_id);
            resolve?.(m.ok ? { ok: true } : { ok: false, code: m.error.code, message: m.error.message });
            break;
          }
          case 'events.batch':
            dispatch({ type: 'batch', events: m.events, now: Date.now() });
            break;
          case 'pong':
            dispatch({ type: 'pong', serverTime: m.server_time, now: Date.now() });
            break;
          case 'error':
            break;
          default:
            if (m.type) onEvent(m);
        }
      },
    });
    socket.current = client;
    client.start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') client.nudge();
    });
    return () => {
      sub.remove();
      client.stop();
      socket.current = null;
    };
  }, [matchId, onEvent]);

  useEffect(() => {
    if (view.needsResync) socket.current?.send({ action: 'resync', after_seq: view.lastSeq });
  }, [view.needsResync, view.lastSeq]);

  useEffect(() => {
    if (view.needsRefetch) refetch().catch(() => {});
  }, [view.needsRefetch, refetch]);

  /** Sends over the socket; if no reply comes, retries over REST with the same ID so it can't double-play. */
  const submitMove = useCallback(
    async (word: string): Promise<MoveOutcome> => {
      const clientMoveId = Crypto.randomUUID();
      const requestId = Crypto.randomUUID();
      const reply = new Promise<MoveOutcome | null>((resolve) => {
        pending.current.set(requestId, resolve);
        setTimeout(() => {
          pending.current.delete(requestId);
          resolve(null);
        }, MOVE_REPLY_TIMEOUT_MS);
      });
      const sent = socket.current?.send({
        action: 'move.submit',
        word,
        client_move_id: clientMoveId,
        request_id: requestId,
      });
      const outcome = sent ? await reply : null;
      if (outcome) return outcome;
      pending.current.delete(requestId);
      try {
        await Matches.submitMove(matchId, word, clientMoveId);
        await refetch().catch(() => {});
        return { ok: true };
      } catch (e) {
        const err = e as ApiError;
        return { ok: false, code: err.code, message: err.message };
      }
    },
    [matchId, refetch],
  );

  const sendReaction = useCallback((key: string) => {
    socket.current?.send({ action: 'reaction', key });
  }, []);

  return { ...view, status, gone, reaction, submitMove, sendReaction, refetch };
}
