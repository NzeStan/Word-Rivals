import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Leaderboards, Tournaments } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { Tournament } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { LINKS } from '@/config/links';
import { useMe, useMyTournaments, useRatingPools, useSeasons, useTournaments } from '@/state/queries';
import { useTheme } from '@/theme';
import { EmptyState, Initials, Pill, Row, Segmented, relativeTime } from '@/ui/bits';
import { Btn, Card, Field, LoadError, RemoteImage, SectionTitle, Spinner, Txt } from '@/ui/primitives';

type Tab = 'tournaments' | 'leaderboards';

export default function CompeteTab() {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('tournaments');
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg, gap: t.spacing.md }}>
        <Txt variant="heading" accessibilityRole="header">
          Compete
        </Txt>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: 'tournaments', label: 'Tournaments' },
            { key: 'leaderboards', label: 'Leaderboards' },
          ]}
        />
      </View>
      {tab === 'tournaments' ? <TournamentList /> : <LeaderboardView />}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// tournaments
// ---------------------------------------------------------------------------
export function statusPill(tournament: Tournament) {
  switch (tournament.status) {
    case 'registration':
      return <Pill label="Open" tone="primary" />;
    case 'running':
      return <Pill label="Live" tone="success" />;
    case 'completed':
      return <Pill label="Finished" />;
    case 'cancelled':
      return <Pill label="Cancelled" tone="danger" />;
    default:
      return null;
  }
}

function whenText(tr: Tournament): string {
  if (tr.status === 'registration') return tr.starts_at ? `Starts ${relativeTime(tr.starts_at)}` : 'Starts when the organizer is ready';
  if (tr.status === 'running') return tr.round_name ?? `Round ${tr.current_round} of ${tr.total_rounds}`;
  if (tr.status === 'completed') return tr.winner ? `Won by ${tr.winner.display_name}` : 'Finished';
  return tr.cancel_reason || 'Cancelled';
}

export function TournamentCard({ tournament: tr }: { tournament: Tournament }) {
  const t = useTheme();
  return (
    <Card
      label={`${tr.name}, ${tr.mode_name}, ${whenText(tr)}`}
      onPress={() => router.push(`/tournament/${tr.id}`)}
      style={{ padding: 0, overflow: 'hidden', gap: 0 }}
    >
      <RemoteImage uri={tr.banner_url || ASSETS.tournamentBanner} label={tr.name} style={{ height: 96 }} />
      <View style={{ padding: t.spacing.md, gap: t.spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <Txt variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
            {tr.name}
          </Txt>
          {statusPill(tr)}
        </View>
        <Txt variant="small" color={t.colors.textMuted} numberOfLines={1}>
          {tr.organizer.name} · {tr.mode_name} · {tr.format_name}
          {tr.best_of > 1 ? ` · Best of ${tr.best_of}` : ''}
        </Txt>
        <Txt variant="small" color={t.colors.textMuted}>
          {whenText(tr)} · {tr.entrants}/{tr.max_entrants} players
        </Txt>
      </View>
    </Card>
  );
}

function TournamentList() {
  const t = useTheme();
  const list = useTournaments();
  const mine = useMyTournaments();
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void list.refetch();
      void mine.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([list.refetch(), mine.refetch()]);
    setRefreshing(false);
  };

  const all = list.data ?? [];
  const myOpen = (mine.data ?? []).filter((x) => x.status === 'registration' || x.status === 'running');
  const myIds = new Set(myOpen.map((x) => x.id));
  const open = all.filter((x) => x.status === 'registration' && !myIds.has(x.id));
  const live = all.filter((x) => x.status === 'running' && !myIds.has(x.id));
  const done = all.filter((x) => x.status === 'completed').slice(0, 10);

  return (
    <ScrollView
      contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
    >
      {list.isPending ? (
        <Spinner />
      ) : list.isError ? (
        <LoadError message={(list.error as ApiError).message} onRetry={refresh} />
      ) : (
        <>
          {myOpen.length ? <Section title="Your tournaments" items={myOpen} /> : null}
          {open.length ? <Section title="Open for registration" items={open} /> : null}
          {live.length ? <Section title="Live now" items={live} /> : null}
          {done.length ? <Section title="Recent results" items={done} /> : null}
          {!myOpen.length && !open.length && !live.length && !done.length ? (
            <EmptyState image={ASSETS.illustrations.emptyTournaments} text="No tournaments right now. Check back soon, or join one with a code." />
          ) : null}
        </>
      )}
      <Btn label="Join with a code" variant="secondary" onPress={() => setJoining(true)} />
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(LINKS.organizers)} style={{ alignSelf: 'center', padding: t.spacing.sm }}>
        <Txt variant="small" color={t.colors.textMuted}>
          Want to host a tournament for your community?
        </Txt>
      </Pressable>
      {joining ? <JoinTournamentSheet onClose={() => setJoining(false)} /> : null}
    </ScrollView>
  );
}

function Section({ title, items }: { title: string; items: Tournament[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.sm }}>
      <SectionTitle>{title}</SectionTitle>
      {items.map((x) => (
        <TournamentCard key={x.id} tournament={x} />
      ))}
    </View>
  );
}

function JoinTournamentSheet({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const tr = await Tournaments.joinByCode(code.trim().toUpperCase());
      onClose();
      router.push(`/tournament/${tr.id}`);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: t.colors.overlay }} />
      <View style={{ backgroundColor: t.colors.surface, padding: t.spacing.lg, paddingBottom: t.spacing.xxl, gap: t.spacing.md }}>
        <Txt variant="title" accessibilityRole="header">
          Join a tournament
        </Txt>
        <Field
          label="Tournament code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          maxLength={12}
          onSubmitEditing={join}
          error={error}
        />
        <Btn label="Join" onPress={join} loading={busy} disabled={!code.trim()} />
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// leaderboards
// ---------------------------------------------------------------------------
function LeaderboardView() {
  const t = useTheme();
  const pools = useRatingPools();
  const seasons = useSeasons();
  const me = useMe();
  const [pool, setPool] = useState<string | null>(null);
  const [season, setSeason] = useState<'all' | 'current'>('all');
  const active = pool ?? pools[0]?.pool ?? null;
  const hasSeason = !!seasons.data?.current;

  useEffect(() => {
    if (!hasSeason) setSeason('all');
  }, [hasSeason]);

  const board = useQuery({
    queryKey: ['leaderboard', active, season],
    queryFn: () => Leaderboards.get(active!, season === 'current' ? 'current' : null),
    enabled: !!active,
  });
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    await board.refetch().catch(() => {});
    setRefreshing(false);
  };

  if (!pools.length) {
    return (
      <View style={{ padding: t.spacing.lg }}>
        <EmptyState image={ASSETS.illustrations.trophy} text="Leaderboards appear once ranked modes are switched on." />
      </View>
    );
  }

  const rows = board.data?.results ?? [];
  const mine = board.data?.me;

  return (
    <ScrollView
      contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
    >
      {pools.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.sm }}>
          {pools.map((p) => (
            <Pressable
              key={p.pool}
              accessibilityRole="button"
              accessibilityState={{ selected: p.pool === active }}
              onPress={() => setPool(p.pool)}
              style={{
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.sm,
                borderRadius: t.radius.pill,
                backgroundColor: p.pool === active ? t.colors.primary : t.colors.surface,
              }}
            >
              <Txt variant="small" color={p.pool === active ? t.colors.textOnPrimary : t.colors.text} style={{ fontWeight: '800' }}>
                {p.name}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <SectionTitle>{pools[0].name}</SectionTitle>
      )}
      {hasSeason ? (
        <Segmented
          value={season}
          onChange={setSeason}
          options={[
            { key: 'all', label: 'All time' },
            { key: 'current', label: seasons.data?.current?.name ?? 'This season' },
          ]}
        />
      ) : null}

      {mine ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, borderColor: t.colors.primary, borderWidth: 2 }}>
          <Txt variant="title" style={{ minWidth: 44 }}>
            #{mine.rank}
          </Txt>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyBold">{me.data?.display_name ?? 'You'}</Txt>
            <Txt variant="small" color={t.colors.textMuted}>
              {mine.games} games
            </Txt>
          </View>
          <Txt variant="title">{Math.round(mine.rating)}</Txt>
        </Card>
      ) : null}

      {board.isPending ? (
        <Spinner />
      ) : board.isError ? (
        <LoadError message={(board.error as ApiError).message} onRetry={refresh} />
      ) : !rows.length ? (
        <EmptyState image={ASSETS.illustrations.trophy} text="No one is ranked yet. Play rated games to claim the top spot." />
      ) : (
        <Card style={{ gap: 0 }}>
          {rows.map((r) => (
            <Row
              key={r.user_id}
              onPress={r.user_id === me.data?.user_id ? undefined : () => router.push(`/player/${r.user_id}`)}
              leading={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                  <Txt variant="bodyBold" style={{ width: 34 }} color={r.rank <= 3 ? t.colors.warning : t.colors.textMuted}>
                    {r.rank}
                  </Txt>
                  <Initials name={r.display_name} size={36} />
                </View>
              }
              title={r.display_name}
              subtitle={`${r.games} games · ${r.wins} wins`}
              trailing={<Txt variant="bodyBold">{Math.round(r.rating)}</Txt>}
            />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
