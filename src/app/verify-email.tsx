import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Auth } from '@/api/endpoints';
import { useTheme } from '@/theme';
import { Btn, Center, Screen, Spinner, Txt } from '@/ui/primitives';

/** Opened from the emailed link: /verify-email?uid=...&token=... */
export default function VerifyEmail() {
  const t = useTheme();
  const { uid, token } = useLocalSearchParams<{ uid: string; token: string }>();
  const result = useQuery({
    queryKey: ['verify-email', uid, token],
    queryFn: () => Auth.verifyEmail(uid ?? '', token ?? ''),
    retry: false,
    staleTime: Infinity,
  });

  return (
    <Screen>
      <Center>
        {result.isPending ? (
          <Spinner />
        ) : (
          <>
            <Txt variant="heading" center>
              {result.isSuccess ? 'Email confirmed' : 'Link not valid'}
            </Txt>
            {result.isError ? (
              <Txt center color={t.colors.textMuted}>
                This link has expired or was already used.
              </Txt>
            ) : null}
            <Btn label="Continue" onPress={() => router.replace('/')} />
          </>
        )}
      </Center>
    </Screen>
  );
}
