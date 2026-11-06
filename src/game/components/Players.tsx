import { View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import type { Match, Participant } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { REACTION_EMOJI } from '@/config/strings';
import { useTheme } from '@/theme';
import { RemoteImage, Txt } from '@/ui/primitives';
import type { LiveReaction } from '../useMatchSession';

function PlayerChip({
  p,
  active,
  isMe,
  reaction,
  showPower,
}: {
  p: Participant;
  active: boolean;
  isMe: boolean;
  reaction: LiveReaction | null;
  showPower: boolean;
}) {
  const t = useTheme();
  const out = p.state === 'eliminated';
  const uri = p.is_bot ? ASSETS.avatars.bot : isMe ? ASSETS.avatars.player : ASSETS.avatars.opponent;
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.sm,
        padding: t.spacing.sm,
        borderRadius: t.radius.md,
        backgroundColor: active ? t.colors.surfaceRaised : t.colors.surface,
        borderWidth: 2,
        borderColor: active ? t.colors.primary : 'transparent',
        opacity: out ? 0.45 : 1,
      }}
    >
      <RemoteImage uri={uri} label={p.display_name} style={{ width: 36, height: 36, borderRadius: 18 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="small" numberOfLines={1} style={{ fontWeight: '800' }}>
          {isMe ? 'You' : p.display_name}
        </Txt>
        <Txt variant="caption" color={t.colors.textMuted} numberOfLines={1}>
          {out
            ? 'Out'
            : p.is_bot
              ? `Bot · ${p.bot_level ?? ''}`
              : showPower
                ? `Power moves: ${p.power_left}`
                : p.is_connected || isMe
                  ? 'Online'
                  : 'Reconnecting…'}
        </Txt>
      </View>
      {reaction ? (
        <Animated.Text
          key={reaction.id}
          entering={ZoomIn.springify()}
          exiting={FadeOut}
          accessibilityLabel={`Reaction ${reaction.key}`}
          style={{ position: 'absolute', right: 4, top: -14, fontSize: 28 }}
        >
          {REACTION_EMOJI[reaction.key] ?? '👋'}
        </Animated.Text>
      ) : null}
    </View>
  );
}

export function Players({ match, reaction }: { match: Match; reaction: LiveReaction | null }) {
  const t = useTheme();
  const showPower = (match.rules.power_moves ?? 0) > 0;
  return (
    <View style={{ flexDirection: 'row', flexWrap: match.participants.length > 2 ? 'wrap' : 'nowrap', gap: t.spacing.sm }}>
      {match.participants.map((p) => (
        <View key={p.seat} style={{ flexBasis: match.participants.length > 2 ? '48%' : undefined, flexGrow: 1, minWidth: 0, flexDirection: 'row' }}>
          <PlayerChip
            p={p}
            active={match.status === 'active' && match.turn_seat === p.seat}
            isMe={p.seat === match.my_seat}
            reaction={reaction?.seat === p.seat ? reaction : null}
            showPower={showPower}
          />
        </View>
      ))}
    </View>
  );
}
