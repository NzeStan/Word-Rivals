import { api } from './http';
import type { Daily, Hint, Match, MatchListItem, Me, Meta, Move, Page, Stats, Ticket, Tokens } from './types';

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
