import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Friends } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { FriendRequest } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { useFriendRequests, useFriends, useMe } from '@/state/queries';
import { queryClient } from '@/state/session';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { EmptyState, Initials, Row, relativeTime } from '@/ui/bits';
import { Btn, Card, LoadError, SectionTitle, Spinner, Txt } from '@/ui/primitives';

export default function FriendsTab() {
  const t = useTheme();
  const me = useMe();
  const friends = useFriends();
  const requests = useFriendRequests();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      void friends.refetch();
      void requests.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([friends.refetch(), requests.refetch()]);
    setRefreshing(false);
  };

  const respond = async (r: FriendRequest, action: 'accept' | 'decline' | 'cancel') => {
    setBusy(r.id);
    try {
      await Friends.respond(r.id, action);
      if (action === 'accept') toast(`You and ${r.from_user.display_name} are now friends`, 'success');
      await queryClient.invalidateQueries({ queryKey: ['friends'] });
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setBusy(null);
    }
  };

  const myId = me.data?.user_id;
  const incoming = (requests.data ?? []).filter((r) => r.to_user.user_id === myId);
  const outgoing = (requests.data ?? []).filter((r) => r.from_user.user_id === myId);
  const list = friends.data ?? [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="heading" accessibilityRole="header">
            Friends
          </Txt>
          <Btn small label="Find players" onPress={() => router.push('/find-players')} />
        </View>

        {incoming.length ? (
          <View style={{ gap: t.spacing.sm }}>
            <SectionTitle>Requests</SectionTitle>
            <Card style={{ gap: 0 }}>
              {incoming.map((r) => (
                <Row
                  key={r.id}
                  leading={<Initials name={r.from_user.display_name} />}
                  title={r.from_user.display_name}
                  subtitle={`Sent ${relativeTime(r.created_at)}`}
                  onPress={() => router.push(`/player/${r.from_user.user_id}`)}
                  trailing={
                    <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
                      <Btn small label="Accept" loading={busy === r.id} onPress={() => respond(r, 'accept')} />
                      <Btn small variant="ghost" label="Decline" disabled={busy === r.id} onPress={() => respond(r, 'decline')} />
                    </View>
                  }
                />
              ))}
            </Card>
          </View>
        ) : null}

        {friends.isPending ? (
          <Spinner />
        ) : friends.isError ? (
          <LoadError message={(friends.error as ApiError).message} onRetry={refresh} />
        ) : list.length ? (
          <View style={{ gap: t.spacing.sm }}>
            <SectionTitle>{`Your friends (${list.length})`}</SectionTitle>
            <Card style={{ gap: 0 }}>
              {list.map((f) => (
                <Row
                  key={f.user_id}
                  leading={<Initials name={f.display_name} />}
                  title={f.display_name}
                  subtitle={`Level ${f.level}`}
                  onPress={() => router.push(`/player/${f.user_id}`)}
                  trailing={
                    <Btn
                      small
                      variant="secondary"
                      label="Challenge"
                      onPress={() => router.push({ pathname: '/player/[id]', params: { id: f.user_id, challenge: '1' } })}
                    />
                  }
                />
              ))}
            </Card>
          </View>
        ) : !incoming.length ? (
          <EmptyState image={ASSETS.illustrations.emptyFriends} text="Add friends to challenge them any time and see when they want a rematch.">
            <Btn label="Find players" onPress={() => router.push('/find-players')} />
          </EmptyState>
        ) : null}

        {outgoing.length ? (
          <View style={{ gap: t.spacing.sm }}>
            <SectionTitle>Waiting for an answer</SectionTitle>
            <Card style={{ gap: 0 }}>
              {outgoing.map((r) => (
                <Row
                  key={r.id}
                  leading={<Initials name={r.to_user.display_name} />}
                  title={r.to_user.display_name}
                  subtitle={`Sent ${relativeTime(r.created_at)}`}
                  trailing={<Btn small variant="ghost" label="Cancel" loading={busy === r.id} onPress={() => respond(r, 'cancel')} />}
                />
              ))}
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
