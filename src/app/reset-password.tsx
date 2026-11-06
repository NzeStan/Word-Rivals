import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Auth } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { useTheme } from '@/theme';
import { Btn, Field, Screen, Txt } from '@/ui/primitives';

/** Opened from the emailed link: /reset-password?uid=...&token=... */
export default function ResetPassword() {
  const t = useTheme();
  const { uid, token } = useLocalSearchParams<{ uid: string; token: string }>();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await Auth.confirmPasswordReset(uid ?? '', token ?? '', password);
      setDone(true);
    } catch (e) {
      const err = e as ApiError;
      setError(err.field('password') ?? err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Txt variant="heading" accessibilityRole="header">
        Choose a new password
      </Txt>
      {done ? (
        <>
          <Txt color={t.colors.textMuted}>Your password has been changed.</Txt>
          <Btn label="Continue" onPress={() => router.replace('/')} />
        </>
      ) : (
        <>
          <Field
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            error={error}
          />
          <Btn label="Save password" onPress={submit} loading={busy} disabled={!password} />
        </>
      )}
    </Screen>
  );
}
