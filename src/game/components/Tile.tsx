import { useEffect, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, useThemeStore } from '@/theme';

export type TileState = 'normal' | 'changed' | 'locked';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Tile({
  letter,
  size,
  state = 'normal',
  selected,
  disabled,
  flip,
  onPress,
  label,
}: {
  letter: string;
  size: number;
  state?: TileState;
  selected?: boolean;
  disabled?: boolean;
  /** Turn over when the letter changes (a played move), rather than a small pop (typing). */
  flip?: boolean;
  onPress?: () => void;
  label?: string;
}) {
  const t = useTheme();
  const fontsReady = useThemeStore((s) => s.fontsReady);
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const previous = useRef(letter);

  useEffect(() => {
    if (previous.current === letter) return;
    previous.current = letter;
    if (reduced) return;
    if (flip) {
      rotate.value = withSequence(withTiming(90, { duration: 110 }), withTiming(0, { duration: 170 }));
    } else {
      scale.value = withSequence(withTiming(0.88, { duration: 60 }), withSpring(1, { damping: 12, stiffness: 320 }));
    }
  }, [letter, flip, reduced, rotate, scale]);

  const motion = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateX: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  const colors =
    state === 'changed'
      ? { bg: t.colors.tileChanged, fg: t.colors.tileChangedText, edge: t.colors.tileChangedEdge }
      : state === 'locked'
        ? { bg: t.colors.tileLocked, fg: t.colors.tileLockedText, edge: t.colors.tileLocked }
        : { bg: t.colors.tile, fg: t.colors.tileText, edge: t.colors.tileEdge };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label ?? `Letter ${letter || 'empty'}`}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        motion,
        {
          width: size,
          height: size * 1.12,
          borderRadius: Math.max(8, size * 0.18),
          backgroundColor: colors.bg,
          borderBottomWidth: Math.max(3, size * 0.07),
          borderBottomColor: colors.edge,
          borderWidth: selected ? 3 : 0,
          borderColor: t.colors.tileSelected,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text
        style={{
          color: colors.fg,
          fontSize: size * 0.56,
          fontFamily: fontsReady ? t.fonts.display : undefined,
          fontWeight: fontsReady ? 'normal' : '800',
          includeFontPadding: false,
        }}
      >
        {letter.toUpperCase()}
      </Text>
    </AnimatedPressable>
  );
}
