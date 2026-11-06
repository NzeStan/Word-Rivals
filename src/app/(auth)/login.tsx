import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { ApiError } from '@/api/http';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme';
import { Btn, Field, Screen, Txt } from '@/ui/primitives';

export default function Login() {
  const t = useTheme();
  const login = useSession((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await login(username, password);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Screen scroll>
        <Txt variant="heading" accessibilityRole="header">
          Welcome back
        </Txt>
        <Field
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        {error ? <Txt color={t.colors.danger}>{error}</Txt> : null}
        <Btn label="Log in" onPress={submit} loading={busy} disabled={!username || !password} />
        <Link href="/(auth)/forgot" style={{ alignSelf: 'center', padding: t.spacing.sm }}>
          <Txt color={t.colors.textMuted}>Forgot your password?</Txt>
        </Link>
        <Btn label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
