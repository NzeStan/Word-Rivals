import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Matches } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { Match } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { LINKS } from '@/config/links';
import { useGameName, useMode } from '@/state/queries';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { goHome } from '@/ui/goHome';
import { Btn, Center, RemoteImage, Screen, Txt } from '@/ui/primitives';

/** Waiting room for a private match. */
export function Lobby({ match, onChanged }: { match: Match; onChanged: () => void }) {
  const t = useTheme();
  const mode = useMode(match.mode);
  const gameName = useGameName();
  const [busy, setBusy] = useState<string | null>(null);
  const code = match.invite_code ?? '';
  const isCreator = match.my_seat === 0;
  const canStart = isCreator && match.participants.length >= match.min_players;

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
      onChanged();
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setBusy(null);
    }
  };

  const invite = () =>
    Share.share({
      message: `Play ${gameName} with me! Enter code ${code} or open ${LINKS.invite}${code}`,
    });

  const leave = async () => {
    try {
      await Matches.leave(match.id);
      goHome();
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    }
  };

  return (
    <Screen>
      <Center>
        <RemoteImage
          uri={ASSETS.illustrations.invite}
          label="Invite a friend"
          style={{ width: 150, height: 150, borderRadius: t.radius.lg }}
        />
        <Txt variant="heading" center accessibilityRole="header">
          Invite a friend
        </Txt>
        <Txt center color={t.colors.textMuted}>
          {mode?.name ?? match.mode} · {match.participants.length} of {match.max_players} players
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Copy invite code ${code}`}
          onPress={async () => {
            await Clipboard.setStringAsync(code);
            toast('Code copied');
          }}
          style={{
            paddingVertical: t.spacing.md,
            paddingHorizontal: t.spacing.xl,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.surfaceRaised,
            alignItems: 'center',
          }}
        >
          <Txt variant="display" style={{ letterSpacing: 4 }}>
            {code}
          </Txt>
          <Txt variant="caption" color={t.colors.textMuted}>
            Tap to copy
          </Txt>
        </Pressable>
        {match.participants.map((p) => (
          <Txt key={p.seat} color={t.colors.textMuted}>
            {p.seat === match.my_seat ? 'You' : p.display_name}
          </Txt>
        ))}
      </Center>
      <View style={{ gap: t.spacing.md }}>
        <Btn label="Share invite" onPress={invite} />
        {canStart && match.participants.length < match.max_players ? (
          <Btn label="Start now" variant="secondary" loading={busy === 'start'} onPress={() => act('start', () => Matches.start(match.id))} />
        ) : null}
        {isCreator && mode?.allow_bots ? (
          <Btn
            label="Add a bot instead"
            variant="secondary"
            loading={busy === 'bot'}
            onPress={() => act('bot', () => Matches.addBot(match.id, 'medium'))}
          />
        ) : null}
        <Btn label="Leave" variant="ghost" onPress={leave} />
      </View>
    </Screen>
  );
}
