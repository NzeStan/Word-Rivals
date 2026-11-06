import { Pressable, useWindowDimensions, View } from 'react-native';
import { feedback } from '@/state/feedback';
import { useTheme } from '@/theme';
import { Txt } from '@/ui/primitives';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const GAP = 5;

function Key({
  label,
  width,
  onPress,
  disabled,
  tone = 'key',
  accessibilityLabel,
}: {
  label: string;
  width: number;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'key' | 'action';
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const bg = tone === 'action' ? t.colors.primary : t.colors.key;
  const edge = tone === 'action' ? t.colors.primaryPressed : t.colors.border;
  const fg = tone === 'action' ? t.colors.textOnPrimary : t.colors.keyText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={2}
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        height: 52,
        borderRadius: t.radius.sm,
        backgroundColor: bg,
        borderBottomWidth: 3,
        borderBottomColor: edge,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        transform: [{ translateY: pressed ? 2 : 0 }],
      })}
    >
      <Txt variant={label.length > 1 ? 'small' : 'title'} color={fg} style={label.length > 1 ? { fontWeight: '800' } : undefined}>
        {label.toUpperCase()}
      </Txt>
    </Pressable>
  );
}

export function GameKeyboard({
  onLetter,
  onErase,
  onSubmit,
  disabled,
  canSubmit,
  submitLabel = 'Play',
}: {
  onLetter: (letter: string) => void;
  onErase: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  canSubmit?: boolean;
  submitLabel?: string;
}) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const usable = Math.min(width, 520) - t.spacing.sm * 2;
  const keyW = (usable - GAP * 9) / 10;
  const actionW = (usable - GAP * 8 - keyW * 7) / 2;

  const letter = (ch: string) => (
    <Key
      key={ch}
      label={ch}
      width={keyW}
      disabled={disabled}
      onPress={() => {
        feedback.key();
        onLetter(ch);
      }}
    />
  );

  return (
    <View style={{ gap: 7, alignItems: 'center', paddingHorizontal: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: GAP }}>{[...ROWS[0]].map(letter)}</View>
      <View style={{ flexDirection: 'row', gap: GAP }}>{[...ROWS[1]].map(letter)}</View>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <Key
          label="⌫"
          accessibilityLabel="Undo letter"
          width={actionW}
          disabled={disabled}
          onPress={() => {
            feedback.key();
            onErase();
          }}
        />
        {[...ROWS[2]].map(letter)}
        <Key
          label={submitLabel}
          tone="action"
          width={actionW}
          disabled={disabled || !canSubmit}
          onPress={() => {
            feedback.submit();
            onSubmit();
          }}
        />
      </View>
    </View>
  );
}
