import { useQuery } from '@tanstack/react-query';
import { DailyChallenge, Friends, Leaderboards, Matches, Notifications, Profile, Tournaments } from '@/api/endpoints';
import { FALLBACK_GAME_NAME } from '@/config/app';

export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: Profile.meta, staleTime: 5 * 60 * 1000 });
}

export function useGameName(): string {
  return useMeta().data?.game_name ?? FALLBACK_GAME_NAME;
}

export function useMode(key: string | undefined) {
  return useMeta().data?.modes.find((m) => m.key === key);
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: Profile.me });
}

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: Profile.stats });
}

export function useActiveMatches() {
  return useQuery({ queryKey: ['matches', 'active'], queryFn: () => Matches.list('active,waiting') });
}

export function useFinishedMatches() {
  return useQuery({ queryKey: ['matches', 'finished'], queryFn: () => Matches.list('completed,aborted') });
}

export function useDaily() {
  return useQuery({ queryKey: ['daily'], queryFn: DailyChallenge.get });
}

export function useFriends() {
  return useQuery({ queryKey: ['friends', 'list'], queryFn: Friends.list });
}

export function useFriendRequests() {
  return useQuery({ queryKey: ['friends', 'requests'], queryFn: Friends.requests });
}

export function useUnreadCount() {
  return useQuery({ queryKey: ['notifications', 'unread'], queryFn: Notifications.unread, select: (p) => p.count });
}

export function useTournaments() {
  return useQuery({ queryKey: ['tournaments', 'list'], queryFn: () => Tournaments.list() });
}

export function useMyTournaments(enabled = true) {
  return useQuery({ queryKey: ['tournaments', 'mine'], queryFn: Tournaments.mine, enabled });
}

export function useSeasons() {
  return useQuery({ queryKey: ['seasons'], queryFn: Leaderboards.seasons, staleTime: 10 * 60 * 1000 });
}

/** Ranked rating pools, from the server's ranked modes. */
export function useRatingPools(): { pool: string; name: string }[] {
  const modes = useMeta().data?.modes ?? [];
  const seen = new Map<string, string>();
  for (const m of modes) if (m.is_ranked && !seen.has(m.pool)) seen.set(m.pool, m.name);
  return [...seen].map(([pool, name]) => ({ pool, name }));
}
