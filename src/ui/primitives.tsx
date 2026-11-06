import { Image } from 'expo-image';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { feedback } from '@/state/feedback';
import { makeStyles, useTheme, useThemeStore } from '@/theme';

type TxtVariant = 'display' | 'heading' | 'title' | 'body' | 'bodyBold' | 'small' | 'caption';

export function Txt({
  variant = 'body',
  color,
  center,
  style,
  ...rest
}: TextProps & { variant?: TxtVariant; color?: string; center?: boolean }) {
  const t = useTheme();
  const fontsReady = useThemeStore((s) => s.fontsReady);
  const family =
    variant === 'display' || variant === 'heading'
      ? t.fonts.display
      : variant === 'title' || variant === 'bodyBold'
        ? t.fonts.bold
        : t.fonts.regular;
  const size = {
    display: t.fontSize.display,
    heading: t.fontSize.heading,
    title: t.fontSize.title,
    body: t.fontSize.body,
    bodyBold: t.fontSize.body,
    small: t.fontSize.small,
    caption: t.fontSize.caption,
  }[variant];
  return (
    <Text
      {...rest}
      style={[
        {
          color: color ?? t.colors.text,
          fontSize: size,
          fontFamily: fontsReady ? family : undefined,
          fontWeight: fontsReady ? 'normal' : variant === 'body' || variant === 'small' || variant === 'caption' ? '500' : '800',
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
    />
  );
}

export function Screen({
  children,
  scroll,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  edges?: ComponentProps<typeof SafeAreaView>['edges'];
}) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: t.colors.background }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ padding: t.spacing.lg, gap: t.spacing.lg, flexGrow: 1 }, style]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, padding: t.spacing.lg, gap: t.spacing.lg }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const useButtonStyles = makeStyles((t) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: t.spacing.xl,
      flexDirection: 'row',
      gap: t.spacing.sm,
      borderBottomWidth: 4,
    },
    small: { minHeight: 40, paddingHorizontal: t.spacing.lg, borderBottomWidth: 3 },
  }),
);

export function Btn({
  label,
  onPress,
  variant = 'primary',
  small,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  small?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const s = useButtonStyles();
  const palette = {
    primary: { bg: t.colors.primary, edge: t.colors.primaryPressed, fg: t.colors.textOnPrimary },
    secondary: { bg: t.colors.surfaceRaised, edge: t.colors.border, fg: t.colors.text },
    ghost: { bg: 'transparent', edge: 'transparent', fg: t.colors.textMuted },
    danger: { bg: t.colors.danger, edge: t.colors.danger, fg: t.colors.textOnPrimary },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      accessibilityLabel={label}
      disabled={off}
      onPress={() => {
        feedback.key();
        onPress?.();
      }}
      style={({ pressed }) => [
        s.base,
        small && s.small,
        {
          backgroundColor: palette.bg,
          borderBottomColor: palette.edge,
          opacity: disabled ? 0.45 : 1,
          transform: [{ translateY: pressed && !off ? 2 : 0 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Txt variant="bodyBold" color={palette.fg}>
          {label}
        </Txt>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...rest
}: ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Txt variant="small" color={t.colors.textMuted}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
        style={{
          minHeight: 52,
          borderRadius: t.radius.md,
          borderWidth: 2,
          borderColor: error ? t.colors.danger : focused ? t.colors.primary : t.colors.border,
          backgroundColor: t.colors.surface,
          color: t.colors.text,
          fontSize: t.fontSize.body,
          paddingHorizontal: t.spacing.lg,
        }}
      />
      {error ? (
        <Txt variant="small" color={t.colors.danger}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  onPress,
  style,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    gap: t.spacing.sm,
    borderWidth: 1,
    borderColor: t.colors.border,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        feedback.key();
        onPress();
      }}
      style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

/** A linked image. If the link is empty or fails, shows a themed block so nothing looks broken. */
export function RemoteImage({
  uri,
  label,
  style,
  contentFit = 'cover',
}: {
  uri: string;
  label?: string;
  style?: ComponentProps<typeof Image>['style'];
  contentFit?: ComponentProps<typeof Image>['contentFit'];
}) {
  const t = useTheme();
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View
        accessibilityLabel={label}
        style={[
          { backgroundColor: t.colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
          style as StyleProp<ViewStyle>,
        ]}
      >
        {label ? (
          <Txt variant="caption" color={t.colors.textMuted}>
            {label}
          </Txt>
        ) : null}
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={label}
      contentFit={contentFit}
      transition={150}
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
      style={style}
    />
  );
}

export function Center({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing.md, padding: t.spacing.xl }}>
      {children}
    </View>
  );
}

export function Spinner() {
  const t = useTheme();
  return <ActivityIndicator size="large" color={t.colors.primary} />;
}

export function SectionTitle({ children }: { children: string }) {
  return <Txt variant="title">{children}</Txt>;
}

/** Error state with a retry, for anything that failed to load. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTheme();
  return (
    <Center>
      <Txt center color={t.colors.textMuted}>
        {message}
      </Txt>
      <Btn small variant="secondary" label="Try again" onPress={onRetry} />
    </Center>
  );
}
