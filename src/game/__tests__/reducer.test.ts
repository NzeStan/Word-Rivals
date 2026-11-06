import type { EventEnvelope, Match } from '@/api/types';
import { initialView, matchReducer, type MatchView } from '../reducer';

const match: Match = {
  id: 'm1',
  mode: 'blitz',
  status: 'active',
  visibility: 'public',
  is_ranked: false,
  invite_code: null,
  rules: {},
  turn_seconds: 30,
  min_players: 2,
  max_players: 2,
  start_word: 'fall',
  current_word: 'fall',
  used_words: ['fall'],
  locked_positions: [],
  turn_seat: 0,
  move_count: 0,
  turn_deadline: null,
  end_reason: null,
  winner_seat: null,
  event_seq: 5,
  my_seat: 0,
  server_time: '2026-01-01T00:00:10.000Z',
  participants: [
    { seat: 0, user_id: '1', display_name: 'A', is_bot: false, bot_level: null, state: 'alive', power_left: 0, placement: null, elimination_reason: null, is_connected: true, rating_before: null, rating_after: null },
    { seat: 1, user_id: '2', display_name: 'B', is_bot: false, bot_level: null, state: 'alive', power_left: 0, placement: null, elimination_reason: null, is_connected: true, rating_before: null, rating_after: null },
  ],
};

const NOW = new Date('2026-01-01T00:00:00.000Z').getTime();
const started = (): MatchView => matchReducer(initialView, { type: 'snapshot', match, now: NOW });
const ev = (seq: number | null, type: string, data: any): EventEnvelope => ({
  event_id: null, match_id: 'm1', seq, type, ts: '', data,
});
const moveAccepted = (seq: number, number: number, after: string) =>
  ev(seq, 'move.accepted', { number, seat: 0, before: 'fall', after, kind: 'sub', positions: [0], power: false });

describe('matchReducer', () => {
  it('takes clock offset and sequence from the snapshot', () => {
    const v = started();
    expect(v.lastSeq).toBe(5);
    expect(v.clockOffsetMs).toBe(10000);
  });

  it('applies events in order', () => {
    const v = matchReducer(started(), { type: 'event', event: moveAccepted(6, 1, 'call'), now: NOW });
    expect(v.match?.current_word).toBe('call');
    expect(v.match?.used_words).toContain('call');
    expect(v.moves).toHaveLength(1);
    expect(v.lastSeq).toBe(6);
  });

  it('ignores events it has already applied', () => {
    let v = matchReducer(started(), { type: 'event', event: moveAccepted(6, 1, 'call'), now: NOW });
    v = matchReducer(v, { type: 'event', event: moveAccepted(6, 1, 'call'), now: NOW });
    expect(v.moves).toHaveLength(1);
    expect(v.lastSeq).toBe(6);
  });

  it('holds a future event and asks for a resync when one is missing', () => {
    const v = matchReducer(started(), { type: 'event', event: moveAccepted(8, 2, 'tall'), now: NOW });
    expect(v.needsResync).toBe(true);
    expect(v.lastSeq).toBe(5);
    expect(v.match?.current_word).toBe('fall');
  });

  it('fills the gap from a resync batch, even out of order', () => {
    let v = matchReducer(started(), { type: 'event', event: moveAccepted(8, 3, 'tall'), now: NOW });
    v = matchReducer(v, {
      type: 'batch',
      now: NOW,
      events: [moveAccepted(8, 3, 'tall'), moveAccepted(6, 1, 'call'), moveAccepted(7, 2, 'ball')],
    });
    expect(v.needsResync).toBe(false);
    expect(v.lastSeq).toBe(8);
    expect(v.match?.current_word).toBe('tall');
    expect(v.moves.map((m) => m.after)).toEqual(['call', 'ball', 'tall']);
  });

  it('updates turn, deadline and the mover’s power from turn.started', () => {
    const v = matchReducer(started(), {
      type: 'event',
      now: NOW,
      event: ev(6, 'turn.started', {
        seat: 1, word: 'call', turn_number: 2, locked_positions: [0],
        deadline: '2026-01-01T00:00:40.000Z', server_time: '2026-01-01T00:00:11.000Z', power_left: 1,
      }),
    });
    expect(v.match?.turn_seat).toBe(1);
    expect(v.match?.locked_positions).toEqual([0]);
    expect(v.match?.participants[1].power_left).toBe(1);
    expect(v.clockOffsetMs).toBe(11000);
  });

  it('applies unsequenced presence without moving the sequence', () => {
    const v = matchReducer(started(), { type: 'event', event: ev(null, 'player.disconnected', { seat: 1 }), now: NOW });
    expect(v.match?.participants[1].is_connected).toBe(false);
    expect(v.lastSeq).toBe(5);
  });

  it('finishes the match and asks for the final snapshot (ratings)', () => {
    const v = matchReducer(started(), {
      type: 'event',
      now: NOW,
      event: ev(6, 'match.completed', { winner_seat: 0, reason: 'timeout', moves: 3, placements: [] }),
    });
    expect(v.match?.status).toBe('completed');
    expect(v.match?.winner_seat).toBe(0);
    expect(v.match?.turn_deadline).toBeNull();
    expect(v.needsRefetch).toBe(true);
  });

  it('never lets an older snapshot rewind the board', () => {
    const later = matchReducer(started(), { type: 'event', event: moveAccepted(6, 1, 'call'), now: NOW });
    const v = matchReducer(later, { type: 'snapshot', match: { ...match, event_seq: 5 }, now: NOW });
    expect(v.match?.current_word).toBe('call');
  });

  it('keeps moves when a reload repeats ones already known', () => {
    let v = matchReducer(started(), { type: 'event', event: moveAccepted(6, 1, 'call'), now: NOW });
    v = matchReducer(v, {
      type: 'moves',
      moves: [
        { number: 1, seat: 0, before: 'fall', after: 'call', kind: 'sub', positions: [0] },
        { number: 2, seat: 1, before: 'call', after: 'ball', kind: 'sub', positions: [0] },
      ],
    });
    expect(v.moves.map((m) => m.number)).toEqual([1, 2]);
  });
});
