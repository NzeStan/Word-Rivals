import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Matches } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { GameMode } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { Btn, RemoteImage, Txt } from '@/ui/primitives';

const LEVELS = ['easy', 'medium', 'hard'] as const;

/** How to play a chosen mode: against a stranger, a friend or a bot. */
export function ModeSheet({ mode, onClose }: { mode: GameMode | null; onClose: () => void }) {
  const t = useTheme();
  const [busy, setBusy] = useState<string | null>(null);

  if (!mode) return null;

  const run = async (key: string, create: () => Promise<{ id: string }>) => {
    setBusy(key);
    try {
      const match = await create();
      onClose();
      router.push(`/match/${match.id}`);
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: t.colors.overlay }} />
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderTopLeftRadius: t.radius.lg,
          borderTopRightRadius: t.radius.lg,
          padding: t.spacing.lg,
          paddingBottom: t.spacing.xxl,
          gap: t.spacing.md,
        }}
      >
        <RemoteImage
          uri={ASSETS.modes[mode.key] ?? ASSETS.modes.default}
          label={mode.name}
          style={{ height: 110, borderRadius: t.radius.md }}
        />
        <Txt variant="heading" accessibilityRole="header">
          {mode.name}
        </Txt>
        <Txt color={t.colors.textMuted}>{mode.description}</Txt>

        {mode.allow_matchmaking ? (
          <Btn
            label="Find a rival"
            onPress={() => {
              onClose();
              router.push({ pathname: '/matchmaking', params: { mode: mode.key } });
            }}
          />
        ) : null}
        {mode.allow_private ? (
          <Btn
            label="Invite a friend"
            variant="secondary"
            loading={busy === 'invite'}
            disabled={!!busy}
            onPress={() => run('invite', () => Matches.create(mode.key))}
          />
        ) : null}
        {mode.allow_bots ? (
          <View style={{ gap: t.spacing.sm }}>
            <Txt variant="small" color={t.colors.textMuted}>
              Practice against a bot (unrated)
            </Txt>
            <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              {LEVELS.map((level) => (
                <Btn
                  key={level}
                  small
                  variant="secondary"
                  style={{ flex: 1, paddingHorizontal: 0 }}
                  label={level[0].toUpperCase() + level.slice(1)}
                  loading={busy === level}
                  disabled={!!busy}
                  onPress={() => run(level, () => Matches.practice(mode.key, level))}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
