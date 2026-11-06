import { router } from 'expo-router';
import { useState } from 'react';
import { Auth } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { useTheme } from '@/theme';
import { Btn, Field, Screen, Txt } from '@/ui/primitives';

export default function Forgot() {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await Auth.requestPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Txt variant="heading" accessibilityRole="header">
        Reset your password
      </Txt>
      {sent ? (
        <Txt color={t.colors.textMuted}>If that email has an account, a reset link is on its way.</Txt>
      ) : (
        <>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            error={error}
          />
          <Btn label="Send reset link" onPress={submit} loading={busy} disabled={!email} />
        </>
      )}
      <Btn label="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
