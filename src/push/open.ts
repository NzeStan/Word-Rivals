import { router } from 'expo-router';

/** Where tapping a notification (push or inbox) takes the player. */
export function openNotification(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const str = (key: string) => (typeof data[key] === 'string' && data[key] ? (data[key] as string) : null);
  const invite = str('invite_code');
  const matchId = str('match_id');
  const tournamentId = str('tournament_id');
  if (data.kind === 'challenge' && invite) router.push(`/join/${invite}`);
  else if (matchId) router.push(`/match/${matchId}`);
  else if (tournamentId) router.push(`/tournament/${tournamentId}`);
  else if (data.kind === 'friend_request') router.push('/(tabs)/friends');
  else router.push('/notifications');
}
