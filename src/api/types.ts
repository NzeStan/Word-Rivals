/** Shapes returned by the django-word-battle API (see its docs/api.md and serializers). */

export type Rules = {
  max_changes?: number;
  scale_with_length?: boolean;
  add_remove?: boolean;
  lock_last_changed?: boolean;
  power_moves?: number;
  allow_repeats?: boolean;
  move_cap?: number;
};

export type GameMode = {
  key: string;
  name: string;
  description: string;
  format: 'live' | 'async' | 'practice' | string;
  word_length_min: number;
  word_length_max: number;
  rules: Rules;
  turn_seconds: number | null;
  min_players: number;
  max_players: number;
  is_ranked: boolean;
  pool: string;
  allow_matchmaking: boolean;
  allow_private: boolean;
  allow_bots: boolean;
};

export type Meta = {
  game_name: string;
  support_email: string;
  server_time: string;
  reactions: string[];
  feature_flags: Record<string, boolean>;
  modes: GameMode[];
};

export type Tokens = { access: string; refresh: string };

export type Me = {
  user_id: string;
  username: string;
  display_name: string;
  country: string;
  xp: number;
  level: number;
  avatar: string | null;
  allow_friend_requests: boolean;
  allow_spectators: boolean;
  show_online_status: boolean;
  show_match_history: boolean;
  suspended_until: string | null;
  entitlements?: Record<string, unknown>;
};

export type Rating = {
  pool: string;
  season: string | null;
  rating: number;
  rd: number;
  games: number;
  wins: number;
  losses: number;
  peak: number;
};

export type Stats = {
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  current_win_streak: number;
  best_win_streak: number;
  moves_played: number;
  daily_streak: number;
  distinct_words: number;
  ratings: Rating[];
};

export type Participant = {
  seat: number;
  user_id: string | null;
  display_name: string;
  is_bot: boolean;
  bot_level: string | null;
  state: string;
  power_left: number;
  placement: number | null;
  elimination_reason: string | null;
  is_connected: boolean;
  rating_before: number | null;
  rating_after: number | null;
};

export type MatchStatus = 'waiting' | 'active' | 'completed' | 'aborted';

export type Match = {
  id: string;
  mode: string;
  status: MatchStatus;
  visibility: string;
  is_ranked: boolean;
  invite_code: string | null;
  rules: Rules;
  turn_seconds: number | null;
  min_players: number;
  max_players: number;
  start_word: string;
  current_word: string;
  used_words: string[];
  locked_positions: number[];
  turn_seat: number | null;
  move_count: number;
  turn_deadline: string | null;
  end_reason: string | null;
  winner_seat: number | null;
  event_seq: number;
  participants: Participant[];
  my_seat: number | null;
  server_time: string;
};

export type MatchListItem = {
  id: string;
  mode: string;
  status: MatchStatus;
  current_word: string;
  move_count: number;
  turn_deadline: string | null;
  opponents: { display_name: string; is_bot: boolean; seat: number }[];
  my_turn: boolean;
  end_reason: string | null;
  finished_at: string | null;
  created_at: string;
};

export type Move = {
  number: number;
  seat: number;
  before: string;
  after: string;
  kind: 'sub' | 'add' | 'del';
  positions: number[];
  is_power?: boolean;
  power?: boolean;
};

export type Ticket = {
  id: number;
  mode: string;
  status: 'waiting' | 'matched' | 'cancelled' | 'expired';
  match_id: string | null;
};

export type Daily = {
  date: string;
  mode: string;
  length: number;
  started: boolean;
  match_id: string | null;
  result: { won: boolean; moves: number; score: number } | null;
};

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export type Hint = { suggestion?: string | null; legal_moves?: number };

/** A message on the match or user socket. */
export type EventEnvelope = {
  event_id: string | null;
  match_id: string | null;
  seq: number | null;
  type: string;
  ts: string;
  data: any;
};
