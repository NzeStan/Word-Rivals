import { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { Auth, Profile } from '@/api/endpoints';
import { ApiError, setSessionExpiredHandler } from '@/api/http';
import { clearTokens, currentTokens, loadTokens, saveTokens } from '@/api/tokens';
import type { Tokens } from '@/api/types';
import { unregisterPush } from '@/push';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => (error instanceof ApiError && error.status > 0 && error.status < 500 ? false : count < 2),
      staleTime: 15000,
    },
  },
});

type SessionState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  /** Invite code from a link opened while signed out; used right after signing in. */
  pendingInvite: string | null;
  /** Any other screen a link asked for while signed out (e.g. a tournament); opened after signing in. */
  pendingPath: string | null;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signInWithTokens: (tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setPendingInvite: (code: string | null) => void;
  setPendingPath: (path: string | null) => void;
};

export const useSession = create<SessionState>((set) => {
  const signedOut = () => {
    queryClient.clear();
    set({ status: 'signedOut' });
  };
  setSessionExpiredHandler(signedOut);

  return {
    status: 'loading',
    pendingInvite: null,
    pendingPath: null,
    bootstrap: async () => {
      const tokens = await loadTokens();
      set({ status: tokens ? 'signedIn' : 'signedOut' });
    },
    login: async (username, password) => {
      await saveTokens(await Auth.login(username.trim(), password));
      set({ status: 'signedIn' });
    },
    register: async (username, email, password) => {
      const { access, refresh } = await Auth.register(username.trim(), email.trim(), password);
      await saveTokens({ access, refresh });
      set({ status: 'signedIn' });
    },
    signInWithTokens: async ({ access, refresh }) => {
      await saveTokens({ access, refresh });
      set({ status: 'signedIn' });
    },
    logout: async () => {
      await unregisterPush();
      const refresh = currentTokens()?.refresh;
      if (refresh) await Auth.logout(refresh).catch(() => {});
      await clearTokens();
      signedOut();
    },
    deleteAccount: async () => {
      await unregisterPush();
      await Profile.deleteAccount();
      await clearTokens();
      signedOut();
    },
    setPendingInvite: (pendingInvite) => set({ pendingInvite }),
    setPendingPath: (pendingPath) => set({ pendingPath }),
  };
});
