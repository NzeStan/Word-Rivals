/**
 * @jest-environment node
 *
 * Plays real matches against a running backend through the app's own API client,
 * socket and reducer. Run the backend first (docker compose up), then: npm run test:e2e
 */
import { Auth, DailyChallenge, Matches, Matchmaking, Profile } from '@/api/endpoints';
import { ApiError, freshAccessToken, refreshAccessToken } from '@/api/http';
import { currentTokens, saveTokens } from '@/api/tokens';
import type { Match, Tokens } from '@/api/types';
import { initialView, matchReducer, type MatchView } from '@/game/reducer';
import { GameSocket } from '@/realtime/socket';

jest.setTimeout(150000);

const unique = () => Math.random().toString(36).slice(2, 10);

/** Sign-ups are limited to 10 a minute per address, so a full run has to wait its turn. */
async function patiently<T>(call: () => Promise<T>): Promise<T> {
  for (;;) {
    try {
      return await call();
    } catch (e) {
      if ((e as ApiError).code !== 'THROTTLED') throw e;
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

async function newPlayer(): Promise<Tokens> {
  const name = `e2e_${unique()}`;
  const { access, refresh } = await patiently(() => Auth.register(name, `${name}@example.com`, 'Str0ng-pass-phrase!'));
  return { access, refresh };
}

const as = (tokens: Tokens) => saveTokens(tokens);

const open: { stop: () => void }[] = [];
afterEach(() => {
  open.splice(0).forEach((c) => c.stop());
});

/** A match client, like the match screen. Tokens are swapped before each call since tests play both sides. */
function connect(matchId: string, tokens: Tokens) {
  let view: MatchView = initialView;
  const waiters: { test: (v: MatchView) => boolean; resolve: () => void }[] = [];
  const results = new Map<string, (m: any) => void>();
  const check = () => {
    for (const w of [...waiters]) {
      if (w.test(view)) {
        waiters.splice(waiters.indexOf(w), 1);
        w.resolve();
      }
    }
  };
  const socket = new GameSocket(`matches/${matchId}/`, {
    onMessage: (m) => {
      const now = Date.now();
      if (m.type === 'session.welcome') view = matchReducer(view, { type: 'snapshot', match: m.data, now });
      else if (m.type === 'move.result') results.get(m.request_id)?.(m);
      else if (m.type === 'events.batch') view = matchReducer(view, { type: 'batch', events: m.events, now });
      else if (m.type === 'pong') view = matchReducer(view, { type: 'pong', serverTime: m.server_time, now });
      else if (m.type) view = matchReducer(view, { type: 'event', event: m, now });
      check();
    },
  });
  open.push(socket);
  return {
    get view() {
      return view;
    },
    start: async () => {
      await saveTokens(tokens);
      socket.start();
    },
    stop: () => socket.stop(),
    send: (message: object) => socket.send(message),
    until: (test: (v: MatchView) => boolean) =>
      new Promise<void>((resolve) => {
        waiters.push({ test, resolve });
        check();
      }),
    move: (word: string) =>
      new Promise<any>((resolve) => {
        const request_id = unique();
        results.set(request_id, resolve);
        socket.send({
          action: 'move.submit',
          word,
          request_id,
          client_move_id: require('node:crypto').randomUUID(),
        });
      }),
  };
}

describe('against the real backend', () => {
  it('serves the game name and modes', async () => {
    const meta = await Profile.meta();
    expect(meta.game_name).toBe('Word Rivals');
    expect(meta.modes.map((m) => m.key)).toEqual(expect.arrayContaining(['blitz', 'practice', 'ranked']));
  });

  it('reports form errors and bad logins the way the screens expect', async () => {
    const bad = await patiently(() => Auth.register('a', 'nope', '1').catch((e) => {
      if (e.code === 'THROTTLED') throw e;
      return e as ApiError;
    }));
    expect((bad as ApiError).code).toBe('VALIDATION_ERROR');
    expect((bad as ApiError).field('username')).toBeTruthy();
    const login = await patiently(() => Auth.login('nobody_here', 'wrong-pass-123').catch((e) => {
      if (e.code === 'THROTTLED') throw e;
      return e as ApiError;
    }));
    expect((login as ApiError).code).toBe('AUTHENTICATION_FAILED');
  });

  it('refreshes a rotated token and keeps working', async () => {
    await as(await newPlayer());
    const before = currentTokens()!.refresh;
    expect(await refreshAccessToken()).toBeTruthy();
    expect(currentTokens()!.refresh).not.toBe(before);
    expect((await Profile.me()).username).toMatch(/^e2e_/);
    expect(await freshAccessToken()).toBeTruthy();
  });

  it('retries a request after an expired access token', async () => {
    const player = await newPlayer();
    await saveTokens({ access: 'not-a-valid-token', refresh: player.refresh });
    expect((await Profile.me()).username).toMatch(/^e2e_/);
  });

  it('plays a private match over sockets: invite, join, moves, errors, resign, result', async () => {
    const alice = await newPlayer();
    const bob = await newPlayer();

    await as(alice);
    const created = await Matches.create('blitz', 'fall');
    expect(created.status).toBe('waiting');
    expect(created.invite_code).toBeTruthy();

    const a = connect(created.id, alice);
    await a.start();
    await a.until((v) => v.match?.status === 'waiting');

    await as(bob);
    const joined = await Matches.join(created.invite_code!);
    expect(joined.status).toBe('active');
    await a.until((v) => v.match?.status === 'active' && v.match.turn_seat !== null);
    // match.started asks for a refetch, which is how the screen learns who joined.
    expect(a.view.needsRefetch).toBe(true);
    expect((await Matches.get(created.id)).participants).toHaveLength(2);

    const b = connect(created.id, bob);
    await b.start();
    await b.until((v) => v.match?.status === 'active');

    const aliceSeat = a.view.match!.my_seat!;
    const mover = a.view.match!.turn_seat === aliceSeat ? a : b;
    const other = mover === a ? b : a;
    const moverTokens = mover === a ? alice : bob;
    const word = a.view.match!.current_word;

    const rejected = await mover.move('zzzzzz');
    expect(rejected.ok).toBe(false);
    expect(['NOT_A_WORD', 'LENGTH_CHANGED', 'TOO_MANY_CHANGES']).toContain(rejected.error.code);

    const notMine = await other.move('zzzz');
    expect(notMine.ok).toBe(false);
    expect(notMine.error.code).toBe('NOT_YOUR_TURN');

    expect(word).toBe('fall');
    const played = 'call';
    const accepted = await mover.move(played);
    expect(accepted.ok).toBe(true);
    expect(accepted.move.after).toBe(played);

    const repeat = await other.move('fall');
    expect(repeat.ok).toBe(false);

    await other.until((v) => v.match?.current_word === played && v.moves.length === 1);
    await other.until((v) => v.match?.turn_seat !== mover.view.match?.my_seat);
    expect(other.view.match!.used_words).toContain(played);
    expect(other.view.clockOffsetMs).toEqual(expect.any(Number));
    expect(other.view.match!.turn_deadline).toBeTruthy();

    // A stale token never reaches here because sockets refresh first; this resign is the final event.
    await saveTokens(moverTokens);
    await Matches.resign(created.id);
    await other.until((v) => v.match?.status === 'completed');
    expect(other.view.match!.winner_seat).toBe(other.view.match!.my_seat);
    expect(other.view.needsRefetch).toBe(true);

    const moves = await Matches.moves(created.id);
    expect(moves).toHaveLength(1);
    expect(moves[0].after).toBe(played);

  });

  it('recovers from a gap by resyncing from the event log', async () => {
    const alice = await newPlayer();
    await as(alice);
    const created = await Matches.practice('practice', 'easy');
    const a = connect(created.id, alice);
    await a.start();
    await a.until((v) => !!v.match);
    // Pretend everything after the start was missed, then ask for it again.
    a.send({ action: 'resync', after_seq: 0 });
    await a.until((v) => v.lastSeq >= created.event_seq);
    expect(a.view.needsResync).toBe(false);
    a.stop();
  });

  it('plays practice: hints work and the bot answers', async () => {
    const alice = await newPlayer();
    await as(alice);
    const created: Match = await Matches.practice('practice', 'easy');
    expect(created.visibility).toBe('practice');
    const a = connect(created.id, alice);
    await a.start();
    await a.until((v) => !!v.match && v.match.turn_seat === v.match.my_seat);

    const hint = await Matches.hint(created.id);
    expect(hint.suggestion).toBeTruthy();

    const before = a.view.moves.length;
    const result = await a.move(hint.suggestion!);
    expect(result.ok).toBe(true);
    await a.until((v) => v.moves.length >= before + 2 && v.match?.turn_seat === v.match?.my_seat);
    expect(a.view.moves[a.view.moves.length - 1].seat).not.toBe(a.view.match!.my_seat);
    a.stop();
  });

  it('adds a bot to a private lobby', async () => {
    await as(await newPlayer());
    const created = await Matches.create('blitz');
    const withBot = await Matches.addBot(created.id, 'easy');
    expect(withBot.participants.some((p) => p.is_bot)).toBe(true);
  });

  it('queues for matchmaking and leaves cleanly', async () => {
    await as(await newPlayer());
    const ticket = await Matchmaking.join('blitz');
    expect(ticket.status).toBe('waiting');
    expect((await Matchmaking.status()).status).toBe('waiting');
    await Matchmaking.leave();
  });

  it('starts the daily challenge once', async () => {
    await as(await newPlayer());
    expect((await DailyChallenge.get()).started).toBe(false);
    const match = await DailyChallenge.start();
    const today = await DailyChallenge.get();
    expect(today.started).toBe(true);
    expect(today.match_id).toBe(match.id);
  });

  it('returns stats and deletes an account', async () => {
    await as(await newPlayer());
    const stats = await Profile.stats();
    expect(stats.matches_played).toBe(0);
    expect(typeof stats.distinct_words).toBe('number');
    await Profile.deleteAccount();
    await expect(Profile.me()).rejects.toBeInstanceOf(ApiError);
  });
});
