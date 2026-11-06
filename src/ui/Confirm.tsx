import type { ReactNode } from 'react';
import { Modal, View } from 'react-native';
import { useTheme } from '@/theme';
import { Btn, Txt } from './primitives';

export function Confirm({
  title,
  message,
  confirmLabel,
  danger,
  busy,
  confirmDisabled,
  children,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'center', padding: t.spacing.xl }}>
        <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg, padding: t.spacing.xl, gap: t.spacing.md }}>
          <Txt variant="title" accessibilityRole="header">
            {title}
          </Txt>
          <Txt color={t.colors.textMuted}>{message}</Txt>
          {children}
          <Btn label={confirmLabel} variant={danger ? 'danger' : 'primary'} loading={busy} disabled={confirmDisabled} onPress={onConfirm} />
          <Btn label="Cancel" variant="ghost" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}
