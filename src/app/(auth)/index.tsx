import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SocialButtons } from '@/auth/SocialButtons';
import { ASSETS } from '@/config/assets';
import { TAGLINE } from '@/config/strings';
import { Tile } from '@/game/components/Tile';
import { useGameName } from '@/state/queries';
import { useState } from 'react';
import { useTheme } from '@/theme';
import { Btn, RemoteImage, Screen, Txt } from '@/ui/primitives';

export default function Welcome() {
  const t = useTheme();
  const name = useGameName();
  const [error, setError] = useState<string>();
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing.xl }}>
        <RemoteImage uri={ASSETS.brand.logo} label={name} style={{ width: 112, height: 112, borderRadius: t.radius.lg }} />
        <View style={{ gap: t.spacing.sm, alignItems: 'center' }}>
          <Txt variant="display" center>
            {name}
          </Txt>
          <Txt center color={t.colors.textMuted}>
            {TAGLINE}
          </Txt>
        </View>
        <Animated.View
          entering={FadeInDown.delay(150).duration(350)}
          accessible
          accessibilityLabel="Example: fall becomes call"
          style={{ flexDirection: 'row', gap: t.spacing.sm }}
        >
          <Tile letter="c" size={54} state="changed" disabled />
          <Tile letter="a" size={54} disabled />
          <Tile letter="l" size={54} disabled />
          <Tile letter="l" size={54} disabled />
        </Animated.View>
      </View>
      <View style={{ gap: t.spacing.md }}>
        <SocialButtons onError={setError} />
        {error ? (
          <Txt center color={t.colors.danger}>
            {error}
          </Txt>
        ) : null}
        <Btn label="Create account with email" onPress={() => router.push('/(auth)/register')} />
        <Btn label="I already have an account" variant="secondary" onPress={() => router.push('/(auth)/login')} />
      </View>
    </Screen>
  );
}
