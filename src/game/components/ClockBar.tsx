import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Txt } from '@/ui/primitives';

/**
 * The turn clock. It follows the server's deadline and never decides anything:
 * reaching zero just shows zero until the server announces the result.
 */
export function ClockBar({
  deadline,
  turnSeconds,
  offsetMs,
  mine,
}: {
  deadline: string | null;
  turnSeconds: number | null;
  offsetMs: number;
  mine: boolean;
}) {
  const t = useTheme();
  const fraction = useSharedValue(1);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    cancelAnimation(fraction);
    if (!deadline || !turnSeconds) {
      fraction.value = 1;
      setSecondsLeft(null);
      return;
    }
    const end = new Date(deadline).getTime();
    const remaining = () => Math.max(0, end - (Date.now() + offsetMs));
    fraction.value = Math.min(1, remaining() / (turnSeconds * 1000));
    fraction.value = withTiming(0, { duration: remaining(), easing: Easing.linear });
    setSecondsLeft(Math.ceil(remaining() / 1000));
    const tick = setInterval(() => setSecondsLeft(Math.ceil(remaining() / 1000)), 250);
    return () => clearInterval(tick);
  }, [deadline, turnSeconds, offsetMs, fraction]);

  const bar = useAnimatedStyle(() => ({ width: `${fraction.value * 100}%` }));

  if (secondsLeft === null) return <View style={{ height: 8 }} />;
  const urgent = secondsLeft <= 5;
  const color = urgent ? t.colors.danger : mine ? t.colors.success : t.colors.textMuted;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
      <View style={{ flex: 1, height: 8, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceRaised, overflow: 'hidden' }}>
        <Animated.View style={[bar, { height: '100%', borderRadius: t.radius.pill, backgroundColor: color }]} />
      </View>
      <Txt variant="bodyBold" color={color} style={{ minWidth: 34, textAlign: 'right' }} accessibilityLabel={`${secondsLeft} seconds left`}>
        {secondsLeft}s
      </Txt>
    </View>
  );
}
