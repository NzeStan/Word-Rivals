import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Matches } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme';
import { goHome } from '@/ui/goHome';
import { Btn, Center, Screen, Spinner, Txt } from '@/ui/primitives';

/** Opened from an invite link. A signed-out player joins right after signing in. */
export default function JoinByLink() {
  const t = useTheme();
  const { code } = useLocalSearchParams<{ code: string }>();
  const status = useSession((s) => s.status);
  const [error, setError] = useState<string>();
  const tried = useRef(false);

  useEffect(() => {
    if (status === 'loading' || tried.current || !code) return;
    tried.current = true;
    if (status === 'signedOut') {
      useSession.getState().setPendingInvite(code);
      router.replace('/(auth)');
      return;
    }
    Matches.join(code.toUpperCase())
      .then((match) => router.replace(`/match/${match.id}`))
      .catch((e: ApiError) => setError(e.message));
  }, [status, code]);

  return (
    <Screen>
      <Center>
        {error ? (
          <>
            <Txt center color={t.colors.textMuted}>
              {error}
            </Txt>
            <Btn label="Go home" onPress={goHome} />
          </>
        ) : (
          <Spinner />
        )}
      </Center>
    </Screen>
  );
}
