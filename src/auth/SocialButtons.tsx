import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Auth, type SocialProvider } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { feedback } from '@/state/feedback';
import { useTheme } from '@/theme';
import { Txt } from '@/ui/primitives';
import { signInWith } from './social';

const LABELS: Record<SocialProvider, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  google: { label: 'Continue with Google', icon: 'logo-google' },
  github: { label: 'Continue with GitHub', icon: 'logo-github' },
};

/** "Continue with Google / GitHub". Shows only the providers the server has set up. */
export function SocialButtons({ onError }: { onError?: (message: string) => void }) {
  const t = useTheme();
  const providers = useQuery({ queryKey: ['social-providers'], queryFn: Auth.socialProviders, staleTime: 10 * 60 * 1000 });
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const list = providers.data?.providers ?? [];
  if (!list.length) return null;

  const go = async (provider: SocialProvider) => {
    feedback.key();
    setBusy(provider);
    try {
      await signInWith(provider);
    } catch (e) {
      onError?.((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: t.spacing.sm }}>
      {list.map((p) => (
        <Pressable
          key={p}
          accessibilityRole="button"
          accessibilityLabel={LABELS[p].label}
          accessibilityState={{ busy: busy === p, disabled: !!busy }}
          disabled={!!busy}
          onPress={() => go(p)}
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: t.radius.md,
            borderWidth: 1,
            borderColor: t.colors.border,
            backgroundColor: t.colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: t.spacing.sm,
            opacity: busy && busy !== p ? 0.5 : 1,
            transform: [{ translateY: pressed ? 1 : 0 }],
          })}
        >
          {busy === p ? (
            <ActivityIndicator color={t.colors.text} />
          ) : (
            <Ionicons name={LABELS[p].icon} size={20} color={t.colors.text} />
          )}
          <Txt variant="bodyBold">{LABELS[p].label}</Txt>
        </Pressable>
      ))}
    </View>
  );
}

export function OrDivider() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.colors.border }} />
      <Txt variant="caption" color={t.colors.textMuted}>
        or
      </Txt>
      <View style={{ flex: 1, height: 1, backgroundColor: t.colors.border }} />
    </View>
  );
}
