import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ApiError } from '@/api/http';
import { finishSocialSignIn } from '@/auth/social';
import { useTheme } from '@/theme';
import { Btn, Center, Screen, Spinner, Txt } from '@/ui/primitives';

/**
 * Where Google/GitHub sign-in returns (wordrivals://auth?code=...).
 * Usually the browser hands the result straight back to the sign-in button; this route
 * covers the times Android opens the link as a fresh deep link instead.
 */
export default function AuthReturn() {
  const t = useTheme();
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const [failed, setFailed] = useState<string | null>(error && error !== 'cancelled' ? 'Sign-in failed. Please try again.' : null);

  useEffect(() => {
    if (!code) {
      if (!error || error === 'cancelled') router.replace('/');
      return;
    }
    finishSocialSignIn(code)
      .then(() => router.replace('/'))
      .catch((e: ApiError) => setFailed(e.message));
  }, [code, error]);

  return (
    <Screen>
      <Center>
        {failed ? (
          <>
            <Txt center color={t.colors.textMuted}>
              {failed}
            </Txt>
            <Btn label="Back to sign in" onPress={() => router.replace('/')} />
          </>
        ) : (
          <Spinner />
        )}
      </Center>
    </Screen>
  );
}
