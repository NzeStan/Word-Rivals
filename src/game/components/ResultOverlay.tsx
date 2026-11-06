import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Matches } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { Match, Move } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { END_REASONS } from '@/config/strings';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { goHome } from '@/ui/goHome';
import { Btn, RemoteImage, Txt } from '@/ui/primitives';

export function ResultOverlay({ match, moves, onDismiss }: { match: Match; moves: Move[]; onDismiss: () => void }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const me = match.participants.find((p) => p.seat === match.my_seat);
  const aborted = match.status === 'aborted';
  const won = !aborted && match.winner_seat !== null && match.winner_seat === match.my_seat;
  const isPractice = match.visibility === 'practice';
  const isDaily = match.mode === 'daily';
  const bot = match.participants.find((p) => p.is_bot);

  const title = aborted ? 'No contest' : !me ? 'Match over' : won ? 'You win!' : match.winner_seat === null ? 'Draw' : 'You lost';
  const image = aborted ? ASSETS.illustrations.aborted : won ? ASSETS.illustrations.victory : ASSETS.illustrations.defeat;
  const delta =
    me?.rating_after != null && me?.rating_before != null ? Math.round(me.rating_after - me.rating_before) : null;

  const playAgain = async () => {
    setBusy(true);
    try {
      const next = isPractice
        ? await Matches.practice(match.mode, bot?.bot_level ?? 'medium')
        : await Matches.rematch(match.id);
      router.replace(`/match/${next.id}`);
    } catch (e) {
      toast((e as ApiError).message, 'danger');
      setBusy(false);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: t.colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        padding: t.spacing.xl,
      }}
    >
      <Animated.View
        entering={ZoomIn.springify().damping(14)}
        accessibilityViewIsModal
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          padding: t.spacing.xl,
          gap: t.spacing.md,
          alignItems: 'center',
        }}
      >
        <RemoteImage uri={image} label={title} style={{ width: 130, height: 130, borderRadius: t.radius.lg }} />
        <Txt variant="display" center color={won ? t.colors.success : t.colors.text} accessibilityRole="header" accessibilityLiveRegion="polite">
          {title}
        </Txt>
        <Txt center color={t.colors.textMuted}>
          {END_REASONS[match.end_reason ?? ''] ?? (aborted ? 'The match was called off.' : '')}
          {moves.length ? `${match.end_reason && END_REASONS[match.end_reason] ? ' · ' : ''}${moves.length} moves` : ''}
        </Txt>
        {delta !== null ? (
          <Txt variant="title" color={delta >= 0 ? t.colors.success : t.colors.danger}>
            {delta >= 0 ? '+' : ''}
            {delta} rating
          </Txt>
        ) : null}
        <View style={{ alignSelf: 'stretch', gap: t.spacing.sm, marginTop: t.spacing.sm }}>
          {!aborted && me && !isDaily ? (
            <Btn label={isPractice ? 'Play again' : 'Rematch'} loading={busy} onPress={playAgain} />
          ) : null}
          <Btn label="See the match" variant="secondary" onPress={onDismiss} />
          <Btn label="Home" variant="ghost" onPress={goHome} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}
