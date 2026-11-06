import type { EventEnvelope, Match, Move, Participant } from '@/api/types';

/** Live match state, rebuilt from the server's snapshot plus its ordered events. */
export type MatchView = {
  match: Match | null;
  moves: Move[];
  lastSeq: number;
  /** A gap was seen in the event stream; ask the server to resend. */
  needsResync: boolean;
  /** Participants changed in a way events don't fully describe; refetch the match. */
  needsRefetch: boolean;
  /** Local clock + offset = server clock. */
  clockOffsetMs: number;
};

export const initialView: MatchView = {
  match: null,
  moves: [],
  lastSeq: 0,
  needsResync: false,
  needsRefetch: false,
  clockOffsetMs: 0,
};

export type MatchAction =
  | { type: 'snapshot'; match: Match; now: number }
  | { type: 'moves'; moves: Move[] }
  | { type: 'event'; event: EventEnvelope; now: number }
  | { type: 'batch'; events: EventEnvelope[]; now: number }
  | { type: 'pong'; serverTime: string; now: number };

const offsetFrom = (serverTime: string, now: number) => new Date(serverTime).getTime() - now;

function patchSeat(match: Match, seat: number, patch: Partial<Participant>): Match {
  return {
    ...match,
    participants: match.participants.map((p) => (p.seat === seat ? { ...p, ...patch } : p)),
  };
}

function addMove(moves: Move[], move: Move): Move[] {
  return moves.some((m) => m.number === move.number) ? moves : [...moves, move].sort((a, b) => a.number - b.number);
}

function applyEvent(view: MatchView, event: EventEnvelope, now: number): MatchView {
  const match = view.match;
  if (!match) return view;
  const d = event.data ?? {};
  switch (event.type) {
    case 'match.started':
      return {
        ...view,
        needsRefetch: true,
        match: { ...match, status: 'active', start_word: d.start_word, current_word: d.start_word, used_words: [d.start_word] },
      };
    case 'player.joined':
    case 'player.left':
      return { ...view, needsRefetch: true };
    case 'turn.started': {
      const next = patchSeat(match, d.seat, { power_left: d.power_left });
      return {
        ...view,
        clockOffsetMs: d.server_time ? offsetFrom(d.server_time, now) : view.clockOffsetMs,
        match: {
          ...next,
          status: 'active',
          turn_seat: d.seat,
          current_word: d.word,
          locked_positions: d.locked_positions ?? [],
          turn_deadline: d.deadline ?? null,
          move_count: d.turn_number - 1,
        },
      };
    }
    case 'move.accepted':
      return {
        ...view,
        moves: addMove(view.moves, {
          number: d.number,
          seat: d.seat,
          before: d.before,
          after: d.after,
          kind: d.kind,
          positions: d.positions ?? [],
          is_power: d.power,
        }),
        match: {
          ...match,
          current_word: d.after,
          move_count: d.number,
          used_words: match.used_words.includes(d.after) ? match.used_words : [...match.used_words, d.after],
        },
      };
    case 'player.eliminated':
      return {
        ...view,
        match: patchSeat(match, d.seat, { state: 'eliminated', elimination_reason: d.reason }),
      };
    case 'match.completed':
      return {
        ...view,
        needsRefetch: true,
        match: { ...match, status: 'completed', winner_seat: d.winner_seat, end_reason: d.reason, turn_deadline: null, turn_seat: null },
      };
    case 'match.aborted':
      return {
        ...view,
        needsRefetch: true,
        match: { ...match, status: 'aborted', end_reason: d.reason, turn_deadline: null, turn_seat: null },
      };
    case 'player.connected':
    case 'player.reconnected':
      return { ...view, match: patchSeat(match, d.seat, { is_connected: true }) };
    case 'player.disconnected':
      return { ...view, match: patchSeat(match, d.seat, { is_connected: false }) };
    default:
      return view;
  }
}

function applySequenced(view: MatchView, event: EventEnvelope, now: number): MatchView {
  if (event.seq === null) return applyEvent(view, event, now);
  if (event.seq <= view.lastSeq) return view; // already applied
  if (event.seq > view.lastSeq + 1) return { ...view, needsResync: true }; // hold until the gap is filled
  return { ...applyEvent(view, event, now), lastSeq: event.seq };
}

export function matchReducer(view: MatchView, action: MatchAction): MatchView {
  switch (action.type) {
    case 'snapshot':
      // A snapshot older than what we've applied must not rewind the board.
      if (view.match && action.match.event_seq < view.lastSeq) return view;
      return {
        ...view,
        match: action.match,
        lastSeq: action.match.event_seq,
        needsResync: false,
        needsRefetch: false,
        clockOffsetMs: offsetFrom(action.match.server_time, action.now),
      };
    case 'moves':
      return { ...view, moves: action.moves.reduce(addMove, view.moves) };
    case 'event':
      return applySequenced(view, action.event, action.now);
    case 'batch': {
      const next = [...action.events]
        .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
        .reduce((v, e) => applySequenced(v, e, action.now), { ...view, needsResync: false });
      return next;
    }
    case 'pong':
      return { ...view, clockOffsetMs: offsetFrom(action.serverTime, action.now) };
  }
}
