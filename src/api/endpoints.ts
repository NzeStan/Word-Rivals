import { api } from './http';
import type {
  AppNotification,
  Daily,
  Friend,
  FriendRequest,
  Hint,
  Leaderboard,
  Match,
  MatchListItem,
  Me,
  Meta,
  Move,
  NotificationPrefs,
  Page,
  PlayerPublic,
  Round,
  Standing,
  Stats,
  Ticket,
  Tokens,
  Tournament,
} from './types';

export type SocialProvider = 'google' | 'github';
export type SocialTokens = Tokens & { user_id: string; created: boolean };

export const Auth = {
  login: (username: string, password: string) =>
    api<Tokens>('auth/token/', { method: 'POST', body: { username, password }, auth: false }),
  register: (username: string, email: string, password: string) =>
    api<Tokens & { user_id: string }>('auth/register/', {
      method: 'POST',
      body: { username, email, password },
      auth: false,
    }),
  logout: (refresh: string) => api('auth/logout/', { method: 'POST', body: { refresh } }),
  requestPasswordReset: (email: string) =>
    api('auth/password-reset/', { method: 'POST', body: { email }, auth: false }),
  confirmPasswordReset: (uid: string, token: string, password: string) =>
    api('auth/password-reset/confirm/', { method: 'POST', body: { uid, token, password }, auth: false }),
  verifyEmail: (uid: string, token: string) =>
    api('auth/verify-email/', { method: 'POST', body: { uid, token }, auth: false }),
  resendVerification: () => api('auth/verify-email/resend/', { method: 'POST' }),
  socialProviders: () => api<{ providers: SocialProvider[] }>('auth/social/providers/', { auth: false }),
  socialExchange: (code: string) =>
    api<SocialTokens>('auth/social/exchange/', { method: 'POST', body: { code }, auth: false }),
};

export const Profile = {
  meta: () => api<Meta>('meta/', { auth: false }),
  me: () => api<Me>('me/'),
  update: (patch: Partial<Me>) => api<Me>('me/', { method: 'PATCH', body: patch }),
  stats: () => api<Stats>('me/stats/'),
  deleteAccount: () => api('me/', { method: 'DELETE', body: { confirm: 'DELETE' } }),
};

export const Matches = {
  list: (status: string) => api<Page<MatchListItem>>(`matches/?status=${status}&page_size=30`),
  get: (id: string) => api<Match>(`matches/${id}/`),
  moves: (id: string) => api<Move[]>(`matches/${id}/moves/`),
  submitMove: (id: string, word: string, client_move_id: string) =>
    api(`matches/${id}/moves/`, { method: 'POST', body: { word, client_move_id } }),
  create: (mode: string, start_word?: string) =>
    api<Match>('matches/', { method: 'POST', body: start_word ? { mode, start_word } : { mode } }),
  challenge: (mode: string, userIds: string[]) =>
    api<Match>('matches/', { method: 'POST', body: { mode, invite_user_ids: userIds } }),
  ready: (id: string) => api<Match>(`matches/${id}/ready/`, { method: 'POST' }),
  join: (invite_code: string) => api<Match>('matches/join/', { method: 'POST', body: { invite_code } }),
  practice: (mode: string, bot_level: string) =>
    api<Match>('matches/practice/', { method: 'POST', body: { mode, bot_level } }),
  hint: (id: string) => api<Hint>(`matches/${id}/hint/`),
  start: (id: string) => api<Match>(`matches/${id}/start/`, { method: 'POST' }),
  leave: (id: string) => api<Match>(`matches/${id}/leave/`, { method: 'POST' }),
  resign: (id: string) => api<Match>(`matches/${id}/resign/`, { method: 'POST' }),
  rematch: (id: string) => api<Match>(`matches/${id}/rematch/`, { method: 'POST' }),
  addBot: (id: string, level: string) =>
    api<Match>(`matches/${id}/add-bot/`, { method: 'POST', body: { level } }),
};

export const Matchmaking = {
  status: () => api<Ticket>('matchmaking/'),
  join: (mode: string) => api<Ticket>('matchmaking/', { method: 'POST', body: { mode } }),
  leave: () => api('matchmaking/', { method: 'DELETE' }),
};

export const DailyChallenge = {
  get: () => api<Daily>('daily/'),
  start: () => api<Match>('daily/start/', { method: 'POST' }),
};

export const Players = {
  search: (q: string) => api<PlayerPublic[]>(`players/?q=${encodeURIComponent(q)}`),
  get: (userId: string) => api<PlayerPublic>(`players/${userId}/`),
  block: (userId: string) => api('blocks/', { method: 'POST', body: { user_id: userId } }),
  report: (userId: string, reason: string, details = '') =>
    api('reports/', { method: 'POST', body: { user_id: userId, reason, details } }),
};

export const Friends = {
  list: () => api<Friend[]>('friends/'),
  remove: (userId: string) => api(`friends/${userId}/`, { method: 'DELETE' }),
  requests: () => api<FriendRequest[]>('friend-requests/'),
  request: (userId: string) => api<FriendRequest>('friend-requests/', { method: 'POST', body: { user_id: userId } }),
  respond: (id: number, action: 'accept' | 'decline' | 'cancel') =>
    api(`friend-requests/${id}/${action}/`, { method: 'POST' }),
};

export const Leaderboards = {
  seasons: () => api<{ current: { key: string; name: string; ends_at: string } | null }>('seasons/', { auth: false }),
  get: (pool: string, season: 'current' | null, page = 1) =>
    api<Leaderboard>(`leaderboards/${pool}/?page=${page}&page_size=50${season ? `&season=${season}` : ''}`),
};

export const Tournaments = {
  list: (status = 'registration,running,completed') => api<Tournament[]>(`tournaments/?status=${status}`),
  mine: () => api<Tournament[]>('me/tournaments/'),
  get: (id: string) => api<Tournament>(`tournaments/${id}/`),
  byCode: (code: string) => api<Tournament>(`tournaments/code/${encodeURIComponent(code)}/`),
  standings: (id: string) => api<Standing[]>(`tournaments/${id}/standings/`),
  rounds: (id: string) => api<Round[]>(`tournaments/${id}/rounds/`),
  join: (id: string, code?: string, externalRef?: string) =>
    api<Tournament>(`tournaments/${id}/join/`, { method: 'POST', body: { code, external_ref: externalRef } }),
  joinByCode: (code: string, externalRef?: string) =>
    api<Tournament>('tournaments/join/', { method: 'POST', body: { code, external_ref: externalRef } }),
  leave: (id: string) => api<Tournament>(`tournaments/${id}/leave/`, { method: 'POST' }),
};

export const Notifications = {
  list: (page = 1) => api<Page<AppNotification>>(`me/notifications/?page=${page}&page_size=40`),
  unread: () => api<Page<AppNotification>>('me/notifications/?unread=1&page_size=1'),
  markAllRead: () => api('me/notifications/', { method: 'POST', body: { all: true } }),
  markRead: (ids: number[]) => api('me/notifications/', { method: 'POST', body: { ids } }),
  prefs: () => api<NotificationPrefs>('me/notification-preferences/'),
  updatePrefs: (patch: Partial<NotificationPrefs>) =>
    api<NotificationPrefs>('me/notification-preferences/', { method: 'PATCH', body: patch }),
};

export const Devices = {
  register: (token: string, platform: 'android' | 'ios' | 'web') =>
    api('me/devices/', { method: 'POST', body: { token, platform } }),
  unregister: (token: string) => api('me/devices/', { method: 'DELETE', body: { token } }),
};
