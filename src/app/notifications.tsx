import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Notifications } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { AppNotification } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { openNotification } from '@/push/open';
import { queryClient } from '@/state/session';
import { useTheme } from '@/theme';
import { EmptyState, Header, Row, relativeTime } from '@/ui/bits';
import { Btn, Card, LoadError, Spinner } from '@/ui/primitives';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  your_turn: 'hourglass',
  match_found: 'flash',
  match_result: 'flag',
  challenge: 'flash',
  friend_request: 'person-add',
  reward: 'gift',
  achievement: 'ribbon',
  daily: 'calendar',
  tournament: 'trophy',
  system: 'information-circle',
};

export default function NotificationsScreen() {
  const t = useTheme();
  const list = useQuery({ queryKey: ['notifications', 'list'], queryFn: () => Notifications.list() });
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void list.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await list.refetch().catch(() => {});
    setRefreshing(false);
  };

  const markAll = async () => {
    await Notifications.markAllRead().catch(() => {});
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const open = (n: AppNotification) => {
    if (!n.read_at) {
      void Notifications.markRead([n.id])
        .then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))
        .catch(() => {});
    }
    openNotification({ ...n.data, kind: n.kind });
  };

  const items = list.data?.results ?? [];
  const unread = items.some((n) => !n.read_at);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        <Header
          title="Notifications"
          right={
            <View style={{ flexDirection: 'row' }}>
              {unread ? <Btn small variant="ghost" label="Mark all read" onPress={markAll} /> : null}
              <Btn small variant="ghost" label="Settings" onPress={() => router.push('/notification-settings')} />
            </View>
          }
        />
        {list.isPending ? (
          <Spinner />
        ) : list.isError ? (
          <LoadError message={(list.error as ApiError).message} onRetry={refresh} />
        ) : !items.length ? (
          <EmptyState image={ASSETS.illustrations.emptyNotifications} text="You're all caught up." />
        ) : (
          <Card style={{ gap: 0 }}>
            {items.map((n) => (
              <Row
                key={n.id}
                onPress={() => open(n)}
                leading={
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: n.read_at ? t.colors.surfaceRaised : t.colors.primary,
                    }}
                  >
                    <Ionicons
                      name={ICONS[n.kind] ?? 'notifications'}
                      size={20}
                      color={n.read_at ? t.colors.textMuted : t.colors.textOnPrimary}
                    />
                  </View>
                }
                title={n.title}
                subtitle={[n.body, relativeTime(n.created_at)].filter(Boolean).join(' · ')}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
