import { useRef, type ComponentRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Match, Move } from '@/api/types';
import { useTheme } from '@/theme';
import { Txt } from '@/ui/primitives';
import { changedIndexes } from '../draft';

/** Every word played so far, oldest at the top, with the letters each move changed highlighted. */
export function WordChain({ match, moves }: { match: Match; moves: Move[] }) {
  const t = useTheme();
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const multi = match.participants.length > 2;
  const nameOf = (seat: number) =>
    seat === match.my_seat ? 'You' : (match.participants.find((p) => p.seat === seat)?.display_name ?? '');

  return (
    <ScrollView
      ref={scroller}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', gap: t.spacing.xs, paddingVertical: t.spacing.xs }}
      onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      showsVerticalScrollIndicator={false}
    >
      {moves.length === 0 ? (
        <Txt center variant="small" color={t.colors.textMuted}>
          Starting word
        </Txt>
      ) : null}
      {moves.map((move) => {
        const changed = changedIndexes(move.before, move.after);
        const mine = move.seat === match.my_seat;
        return (
          <Animated.View
            key={move.number}
            entering={FadeInDown.duration(220)}
            style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'center', gap: t.spacing.sm }}
          >
            {!mine && multi ? (
              <Txt variant="caption" color={t.colors.textMuted} numberOfLines={1} style={{ maxWidth: 90 }}>
                {nameOf(move.seat)}
              </Txt>
            ) : null}
            <View
              accessibilityLabel={`${nameOf(move.seat)} played ${move.after}`}
              style={{
                flexDirection: 'row',
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.xs,
                borderRadius: t.radius.sm,
                backgroundColor: mine ? t.colors.surfaceRaised : t.colors.surface,
              }}
            >
              {[...move.after].map((ch, i) => (
                <Text
                  key={i}
                  style={{
                    color: changed.includes(i) ? t.colors.accent : t.colors.text,
                    fontSize: t.fontSize.body,
                    fontWeight: '800',
                    letterSpacing: 2,
                  }}
                >
                  {ch.toUpperCase()}
                </Text>
              ))}
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}
