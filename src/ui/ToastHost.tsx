import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToasts } from '@/state/toast';
import { useTheme } from '@/theme';
import { Txt } from './primitives';

export function ToastHost() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toasts = useToasts((s) => s.toasts);
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + t.spacing.sm, left: t.spacing.lg, right: t.spacing.lg, gap: t.spacing.sm }}
    >
      {toasts.map((item) => (
        <Animated.View
          key={item.id}
          accessibilityLiveRegion="polite"
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(200)}
          style={{
            backgroundColor:
              item.tone === 'danger' ? t.colors.danger : item.tone === 'success' ? t.colors.success : t.colors.surfaceRaised,
            borderRadius: t.radius.md,
            paddingVertical: t.spacing.md,
            paddingHorizontal: t.spacing.lg,
          }}
        >
          <Txt variant="bodyBold" center color={item.tone === 'info' ? t.colors.text : t.colors.textOnPrimary}>
            {item.message}
          </Txt>
        </Animated.View>
      ))}
    </View>
  );
}
