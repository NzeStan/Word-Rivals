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
  tournament?: MatchTournament | null;
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

// ---- tournaments ------------------------------------------------------------

export type TournamentStatus = 'draft' | 'registration' | 'running' | 'completed' | 'cancelled';

export type Entry = {
  user_id: string | null;
  display_name: string;
  seed: number | null;
  status: 'registered' | 'active' | 'eliminated' | 'finished' | 'withdrawn' | 'disqualified';
  external_ref: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  byes: number;
  tiebreak: number;
  final_rank: number | null;
  rating: number;
};

export type Standing = Entry & { position: number };

export type TournamentGame = {
  number: number;
  match_id: string;
  status: MatchStatus;
  start_word: string;
  final_word: string;
  moves: number;
  end_reason: string;
  winner_user_id: string | null;
  result: string | null;
  check_in_deadline: string | null;
};

export type Pairing = {
  position: number;
  status: 'running' | 'completed' | 'pending';
  a: Entry | null;
  b: Entry | null;
  a_wins?: number;
  b_wins?: number;
  draws?: number;
  winner_user_id?: string | null;
  reason?: string | null;
  games: TournamentGame[];
};

export type Round = { number: number; name: string; status: string; pairings: Pairing[] };

export type Tournament = {
  id: string;
  code: string;
  name: string;
  organizer: { id: string; name: string; slug: string; website: string; logo_url: string };
  mode: string;
  mode_name: string;
  format: 'single_elimination' | 'round_robin' | 'swiss';
  format_name: string;
  best_of: number;
  status: TournamentStatus;
  visibility: 'public' | 'unlisted';
  description: string;
  rules_text: string;
  prizes_text: string;
  banner_url: string;
  min_entrants: number;
  max_entrants: number;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  starts_at: string | null;
  check_in_seconds: number;
  current_round: number;
  total_rounds: number;
  started_at: string | null;
  finished_at: string | null;
  cancel_reason: string;
  winner: Entry | null;
  join_url: string;
  entrants: number;
  round_name?: string | null;
  my_entry?: Entry | null;
  my_match?: { match_id: string; status: MatchStatus; check_in_deadline: string | null } | null;
};

export type MatchTournament = {
  id: string;
  name: string;
  round: number;
  round_name: string;
  game: number;
  best_of: number;
  check_in_deadline: string | null;
  ready_user_ids: string[];
  series: { a_wins: number; b_wins: number; draws: number };
};

// ---- social, leaderboards, notifications --------------------------------------

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  display_name: string;
  rating: number;
  games: number;
  wins: number;
  level?: number;
};

export type Leaderboard = Page<LeaderboardRow> & { me?: { rank: number; rating: number; games: number } };

export type Friend = { user_id: string; display_name: string; level: number; since: string };

export type FriendRequest = {
  id: number;
  status: string;
  created_at: string;
  from_user: { user_id: string; display_name: string };
  to_user: { user_id: string; display_name: string };
};

export type PlayerPublic = {
  user_id: string;
  display_name: string;
  level: number;
  country?: string;
  stats?: { matches_played: number; wins: number; best_win_streak: number };
  ratings?: Rating[];
  is_friend?: boolean;
};

export type AppNotification = {
  id: number;
  kind: string;
  title: string;
  body: string;
  data: Record<string, string>;
  read_at: string | null;
  created_at: string;
};

export type NotificationPrefs = {
  your_turn: boolean;
  match_results: boolean;
  friend_requests: boolean;
  challenges: boolean;
  daily_reminder: boolean;
  rewards: boolean;
  tournaments: boolean;
  marketing: boolean;
};
