import { router } from 'expo-router';
import { View } from 'react-native';
import type { MatchListItem } from '@/api/types';
import { END_REASONS } from '@/config/strings';
import { useMode } from '@/state/queries';
import { useTheme } from '@/theme';
import { Card, Txt } from '@/ui/primitives';

export function MatchRow({ item }: { item: MatchListItem }) {
  const t = useTheme();
  const mode = useMode(item.mode);
  const rivals = item.opponents.map((o) => o.display_name).join(', ') || 'Waiting for a rival';
  const active = item.status === 'active';
  const status = item.my_turn
    ? 'Your turn'
    : active
      ? 'Their turn'
      : item.status === 'waiting'
        ? 'Waiting'
        : item.status === 'aborted'
          ? 'No contest'
          : (END_REASONS[item.end_reason ?? ''] ?? 'Finished');
  return (
    <Card
      label={`${mode?.name ?? item.mode} against ${rivals}. ${status}`}
      onPress={() => router.push(`/match/${item.id}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, padding: t.spacing.md }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="bodyBold" numberOfLines={1}>
          {rivals}
        </Txt>
        <Txt variant="small" color={t.colors.textMuted} numberOfLines={1}>
          {mode?.name ?? item.mode}
          {item.current_word ? ` · ${item.current_word.toUpperCase()}` : ''}
        </Txt>
      </View>
      <Txt variant="small" color={item.my_turn ? t.colors.success : t.colors.textMuted} style={{ fontWeight: '800' }}>
        {status}
      </Txt>
    </Card>
  );
}
