import { useQuery } from '@tanstack/react-query';
import { DailyChallenge, Matches, Profile } from '@/api/endpoints';
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
