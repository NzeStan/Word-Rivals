import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking } from 'react-native';
import { ApiError } from '@/api/http';
import { LINKS } from '@/config/links';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme';
import { Btn, Field, Screen, Txt } from '@/ui/primitives';

export default function Register() {
  const t = useTheme();
  const register = useSession((s) => s.register);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await register(username, email, password);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  const fieldErrors = !!error && ['username', 'email', 'password'].some((f) => error.field(f));

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Screen scroll>
        <Txt variant="heading" accessibilityRole="header">
          Create your account
        </Txt>
        <Field
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          error={
            error?.field('username')?.includes('pattern')
              ? 'Use 3 to 30 letters, numbers, dots or underscores.'
              : error?.field('username')
          }
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          error={error?.field('email')}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          error={error?.field('password') ?? error?.field('non_field_errors')}
        />
        {error && !fieldErrors && !error.field('non_field_errors') ? <Txt color={t.colors.danger}>{error.message}</Txt> : null}
        <Btn label="Create account" onPress={submit} loading={busy} disabled={!username || !email || !password} />
        <Txt variant="small" center color={t.colors.textMuted}>
          By continuing you agree to the{' '}
          <Txt variant="small" color={t.colors.text} accessibilityRole="link" onPress={() => Linking.openURL(LINKS.terms)}>
            Terms
          </Txt>{' '}
          and{' '}
          <Txt variant="small" color={t.colors.text} accessibilityRole="link" onPress={() => Linking.openURL(LINKS.privacy)}>
            Privacy Policy
          </Txt>
          .
        </Txt>
        <Btn label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
