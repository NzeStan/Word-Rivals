import { useEffect } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Txt } from '@/ui/primitives';
import { cellLocked, isChanged, structureChanged, type Draft, type DraftContext } from '../draft';
import { Tile, type TileState } from './Tile';

const GAP = 6;
const HANDLE = 18;

/** The tile row the player edits. `shakeKey` shakes it whenever it changes (a rejected word). */
export function Board({
  draft,
  context,
  interactive,
  shakeKey,
  onSelect,
  onInsert,
}: {
  draft: Draft;
  context: DraftContext;
  interactive: boolean;
  shakeKey: number;
  onSelect: (i: number) => void;
  onInsert: (gap: number) => void;
}) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const offsetX = useSharedValue(0);

  useEffect(() => {
    if (shakeKey === 0) return;
    offsetX.value = withSequence(
      withTiming(-9, { duration: 45 }),
      withTiming(9, { duration: 70 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 45 }),
    );
  }, [shakeKey, offsetX]);

  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: offsetX.value }] }));

  const showHandles = interactive && !!context.rules.add_remove && !structureChanged(draft);
  const count = draft.cells.length;
  const reserved = t.spacing.lg * 2 + GAP * (count - 1) + (showHandles ? (HANDLE + GAP) * (count + 1) : 0);
  const size = Math.min(68, Math.floor((Math.min(width, 520) - reserved) / count));

  const handle = (gap: number) => (
    <Pressable
      key={`gap-${gap}`}
      accessibilityRole="button"
      accessibilityLabel={`Add a letter at position ${gap + 1}`}
      onPress={() => onInsert(gap)}
      hitSlop={6}
      style={{
        width: HANDLE,
        height: size * 0.6,
        borderRadius: t.radius.sm,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: t.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="caption" color={t.colors.textMuted}>
        +
      </Txt>
    </Pressable>
  );

  return (
    <Animated.View style={[shake, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: GAP }]}>
      {showHandles ? handle(0) : null}
      {draft.cells.flatMap((cell, i) => {
        const locked = cellLocked(draft, i, context);
        const state: TileState = locked ? 'locked' : isChanged(draft, i) ? 'changed' : 'normal';
        const tile = (
          <Tile
            key={`${cell.origin ?? 'new'}-${i}`}
            letter={cell.ch}
            size={size}
            state={state}
            selected={interactive && draft.selected === i}
            disabled={!interactive || locked}
            flip={!interactive}
            label={`Letter ${i + 1}, ${cell.ch || 'empty'}${locked ? ', locked' : ''}`}
            onPress={() => onSelect(i)}
          />
        );
        return showHandles ? [tile, handle(i + 1)] : [tile];
      })}
    </Animated.View>
  );
}
