import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import type { EventEnvelope } from '@/api/types';
import { queryClient, useSession } from '@/state/session';
import { toast } from '@/state/toast';
import { GameSocket } from './socket';

/** The latest personal event, for screens that wait on one (matchmaking waits for match.found). */
export const useLastUserEvent = create<{ event: EventEnvelope | null }>(() => ({ event: null }));

function handle(event: EventEnvelope) {
  useLastUserEvent.setState({ event });
  const d = event.data ?? {};
  switch (event.type) {
    case 'reward.earned': {
      const parts = [d.coins ? `+${d.coins} coins` : '', d.xp ? `+${d.xp} XP` : ''].filter(Boolean);
      if (parts.length) toast(parts.join('  ·  '), 'success');
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      break;
    }
    case 'achievement.unlocked':
      toast(`Achievement unlocked: ${d.name}`, 'success');
      break;
    case 'match.found':
    case 'match.completed':
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      void queryClient.invalidateQueries({ queryKey: ['daily'] });
      break;
  }
}

/** Keeps the personal event socket open for as long as the player is signed in. */
export function useUserEvents() {
  const signedIn = useSession((s) => s.status === 'signedIn');

  useEffect(() => {
    if (!signedIn) return;
    const socket = new GameSocket('me/', {
      onMessage: (message) => {
        if (message.type && message.type !== 'session.welcome' && message.type !== 'pong') handle(message);
      },
    });
    socket.start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') socket.nudge();
    });
    return () => {
      sub.remove();
      socket.stop();
    };
  }, [signedIn]);
}
