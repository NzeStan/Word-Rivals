import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ApiError } from '@/api/http';
import { ASSETS } from '@/config/assets';
import { MatchRow } from '@/game/components/ActiveMatchRow';
import { useActiveMatches, useFinishedMatches } from '@/state/queries';
import { useTheme } from '@/theme';
import { LoadError, RemoteImage, SectionTitle, Spinner, Txt } from '@/ui/primitives';

export default function MatchesTab() {
  const t = useTheme();
  const active = useActiveMatches();
  const finished = useFinishedMatches();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void active.refetch();
      void finished.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([active.refetch(), finished.refetch()]);
    setRefreshing(false);
  };

  const live = active.data?.results ?? [];
  const past = finished.data?.results ?? [];
  const error = active.error ?? finished.error;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        <Txt variant="heading" accessibilityRole="header">
          Matches
        </Txt>
        {active.isPending || finished.isPending ? (
          <Spinner />
        ) : error ? (
          <LoadError message={(error as ApiError).message} onRetry={refresh} />
        ) : !live.length && !past.length ? (
          <View style={{ alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xl }}>
            <RemoteImage
              uri={ASSETS.illustrations.emptyMatches}
              label="No matches"
              style={{ width: '100%', height: 180, borderRadius: t.radius.lg }}
            />
            <Txt center color={t.colors.textMuted}>
              Your matches will show up here. Head to Play to start your first one.
            </Txt>
          </View>
        ) : (
          <>
            {live.length ? (
              <View style={{ gap: t.spacing.sm }}>
                <SectionTitle>In progress</SectionTitle>
                {live.map((m) => (
                  <MatchRow key={m.id} item={m} />
                ))}
              </View>
            ) : null}
            {past.length ? (
              <View style={{ gap: t.spacing.sm }}>
                <SectionTitle>Finished</SectionTitle>
                {past.map((m) => (
                  <MatchRow key={m.id} item={m} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
