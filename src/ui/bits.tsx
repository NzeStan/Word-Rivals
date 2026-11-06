import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { feedback } from '@/state/feedback';
import { useTheme } from '@/theme';
import { goHome } from './goHome';
import { RemoteImage, Txt } from './primitives';

/** Title row with a back button, for screens outside the tabs. */
export function Header({ title, right }: { title: string; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 44 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : goHome())}
        style={{ padding: t.spacing.xs }}
      >
        <Ionicons name="chevron-back" size={26} color={t.colors.text} />
      </Pressable>
      <Txt variant="title" numberOfLines={1} style={{ flex: 1 }} accessibilityRole="header">
        {title}
      </Txt>
      {right}
    </View>
  );
}

/** A two-or-more option switch. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: t.colors.surface, borderRadius: t.radius.pill, padding: 4 }}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              feedback.key();
              onChange(o.key);
            }}
            style={{
              flex: 1,
              paddingVertical: t.spacing.sm,
              borderRadius: t.radius.pill,
              backgroundColor: on ? t.colors.primary : 'transparent',
            }}
          >
            <Txt variant="bodyBold" center color={on ? t.colors.textOnPrimary : t.colors.textMuted}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small rounded label, e.g. a status. */
export function Pill({ label, tone = 'muted' }: { label: string; tone?: 'primary' | 'success' | 'danger' | 'muted' }) {
  const t = useTheme();
  const bg = { primary: t.colors.primary, success: t.colors.success, danger: t.colors.danger, muted: t.colors.surfaceRaised }[tone];
  const fg = tone === 'muted' ? t.colors.text : t.colors.textOnPrimary;
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: bg, borderRadius: t.radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Txt variant="caption" color={fg} style={{ fontWeight: '800' }}>
        {label}
      </Txt>
    </View>
  );
}

/** Round avatar with initials (players don't have photos yet). */
export function Initials({ name, size = 40 }: { name: string; size?: number }) {
  const t = useTheme();
  const letters = name
    .split(/[\s_.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="bodyBold" style={{ fontSize: size * 0.38 }}>
        {letters || '?'}
      </Txt>
    </View>
  );
}

/**
 * A row with a leading element, text and an optional trailing element.
 * Only the main area is tappable, so a trailing button is never nested inside another button.
 */
export function Row({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  label,
  style,
}: {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.sm }, style]}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={label ?? (subtitle ? `${title}, ${subtitle}` : title)}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.md,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {leading}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt variant="bodyBold" numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="small" color={t.colors.textMuted} numberOfLines={2}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
      </Pressable>
      {trailing}
    </View>
  );
}

export function EmptyState({ image, text, children }: { image: string; text: string; children?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.lg }}>
      <RemoteImage uri={image} label="" style={{ width: '100%', height: 160, borderRadius: t.radius.lg }} />
      <Txt center color={t.colors.textMuted}>
        {text}
      </Txt>
      {children}
    </View>
  );
}

/** "in 3 min", "2 h ago" — short and friendly. */
export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [86400000, 'd'],
    [3600000, 'h'],
    [60000, 'min'],
  ];
  for (const [ms, unit] of units) {
    if (abs >= ms) {
      const n = Math.round(abs / ms);
      return diff > 0 ? `in ${n} ${unit}` : `${n} ${unit} ago`;
    }
  }
  return diff > 0 ? 'in a moment' : 'just now';
}
