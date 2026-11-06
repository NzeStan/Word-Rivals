import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, RefreshControl, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tournaments } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { Pairing, Round, Standing, Tournament } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { LINKS } from '@/config/links';
import { queryClient, useSession } from '@/state/session';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { Confirm } from '@/ui/Confirm';
import { Header, Initials, Row, Segmented, relativeTime } from '@/ui/bits';
import { Btn, Card, Center, LoadError, RemoteImage, SectionTitle, Spinner, Txt } from '@/ui/primitives';
import { statusPill } from '../(tabs)/compete';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Tab = 'standings' | 'rounds' | 'info';

/** Opened from the list, a notification, or a shared link (wordrivals://tournament/<code>?ref=...). */
export default function TournamentScreen() {
  const t = useTheme();
  const { id: idOrCode, ref } = useLocalSearchParams<{ id: string; ref?: string }>();
  const signedIn = useSession((s) => s.status === 'signedIn');
  const byCode = !UUID.test(idOrCode ?? '');
  const [tab, setTab] = useState<Tab>('standings');
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const detail = useQuery({
    queryKey: ['tournament', idOrCode, signedIn],
    queryFn: () => (byCode ? Tournaments.byCode(idOrCode!) : Tournaments.get(idOrCode!)),
    enabled: !!idOrCode,
    staleTime: 0,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (d?.my_match && d.my_match.status !== 'waiting' && d.my_match.status !== 'active') return 2000; // result being settled
      return d?.status === 'running' || d?.status === 'registration' ? 15000 : false;
    },
  });
  const tr = detail.data;
  const id = tr?.id;
  const live = tr?.status === 'running';
  const standings = useQuery({
    queryKey: ['tournament', id, 'standings'],
    queryFn: () => Tournaments.standings(id!),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: live ? 15000 : false,
  });
  const rounds = useQuery({
    queryKey: ['tournament', id, 'rounds'],
    queryFn: () => Tournaments.rounds(id!),
    enabled: !!id && tr?.status !== 'registration',
    staleTime: 0,
    refetchInterval: live ? 15000 : false,
  });

  useEffect(() => {
    if (tr && tr.status !== 'registration' && tab === 'standings' && tr.format === 'single_elimination') setTab('rounds');
    // Only when the tournament first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tr?.id]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([detail.refetch(), standings.refetch(), rounds.refetch()]);
    setRefreshing(false);
  };

  const after = (next: Tournament) => {
    queryClient.setQueryData(['tournament', idOrCode, signedIn], next);
    void queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    void standings.refetch();
  };

  const join = async () => {
    if (!tr) return;
    if (!signedIn) {
      useSession.getState().setPendingPath(`/tournament/${tr.id}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`);
      router.replace('/(auth)');
      return;
    }
    setBusy(true);
    try {
      after(await Tournaments.join(tr.id, tr.code, ref));
      toast(`You're in! We'll tell you when your first match is ready.`, 'success');
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!tr) return;
    setConfirmLeave(false);
    setBusy(true);
    try {
      after(await Tournaments.leave(tr.id));
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  if (detail.isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
        <Center>
          <Spinner />
        </Center>
      </SafeAreaView>
    );
  }
  if (detail.isError || !tr) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background, padding: t.spacing.lg }}>
        <Header title="Tournament" />
        <LoadError message={(detail.error as ApiError)?.message ?? 'Not found'} onRetry={() => detail.refetch()} />
      </SafeAreaView>
    );
  }

  const mine = tr.my_entry;
  const entered = !!mine && ['registered', 'active'].includes(mine.status);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ paddingHorizontal: t.spacing.lg }}>
        <Header
          title={tr.name}
          right={
            <Btn
              small
              variant="ghost"
              label="Share"
              onPress={() =>
                Share.share({ message: `Join ${tr.name}: ${tr.join_url || `${LINKS.tournament}${tr.code}`} (code ${tr.code})` })
              }
            />
          }
        />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: t.spacing.sm, gap: t.spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          <RemoteImage uri={tr.banner_url || ASSETS.tournamentBanner} label={tr.name} style={{ height: 120 }} />
          <View style={{ padding: t.spacing.md, gap: t.spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              {tr.organizer.logo_url ? (
                <RemoteImage uri={tr.organizer.logo_url} label={tr.organizer.name} style={{ width: 24, height: 24, borderRadius: 6 }} />
              ) : null}
              <Txt variant="small" color={t.colors.textMuted} style={{ flex: 1 }} numberOfLines={1}>
                Hosted by {tr.organizer.name}
              </Txt>
              {statusPill(tr)}
            </View>
            <Txt variant="small" color={t.colors.textMuted}>
              {tr.mode_name} · {tr.format_name}
              {tr.best_of > 1 ? ` · Best of ${tr.best_of}` : ''} · {tr.entrants}/{tr.max_entrants} players
            </Txt>
            <Txt variant="small" color={t.colors.textMuted}>
              {tr.status === 'registration'
                ? tr.starts_at
                  ? `Starts ${relativeTime(tr.starts_at)} · ${new Date(tr.starts_at).toLocaleString()}`
                  : 'Starts when the organizer is ready'
                : tr.status === 'running'
                  ? (tr.round_name ?? `Round ${tr.current_round}`) + ` of ${tr.total_rounds}`
                  : tr.status === 'cancelled'
                    ? tr.cancel_reason || 'Cancelled'
                    : `Finished ${relativeTime(tr.finished_at)}`}
            </Txt>
          </View>
        </Card>

        {tr.status === 'completed' && tr.winner ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <RemoteImage uri={ASSETS.illustrations.trophy} label="Trophy" style={{ width: 56, height: 56, borderRadius: t.radius.md }} />
            <View style={{ flex: 1 }}>
              <Txt variant="caption" color={t.colors.textMuted}>
                Champion
              </Txt>
              <Txt variant="title">{tr.winner.display_name}</Txt>
              {mine?.final_rank ? (
                <Txt variant="small" color={t.colors.textMuted}>
                  You finished #{mine.final_rank}
                </Txt>
              ) : null}
            </View>
          </Card>
        ) : null}

        {tr.my_match ? <MyMatchCard tr={tr} /> : null}

        {tr.status === 'registration' ? (
          entered ? (
            <View style={{ gap: t.spacing.sm }}>
              <Txt center color={t.colors.success} variant="bodyBold">
                You’re registered
              </Txt>
              <Btn label="Withdraw" variant="ghost" loading={busy} onPress={() => setConfirmLeave(true)} />
            </View>
          ) : (
            <Btn label={signedIn ? 'Join tournament' : 'Sign in to join'} loading={busy} onPress={join} disabled={tr.entrants >= tr.max_entrants} />
          )
        ) : tr.status === 'running' && entered ? (
          <Btn label="Withdraw from tournament" variant="ghost" loading={busy} onPress={() => setConfirmLeave(true)} />
        ) : null}

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: 'standings', label: 'Standings' },
            { key: 'rounds', label: tr.format === 'single_elimination' ? 'Bracket' : 'Rounds' },
            { key: 'info', label: 'Info' },
          ]}
        />

        {tab === 'standings' ? (
          <StandingsList rows={standings.data ?? []} loading={standings.isPending} tr={tr} />
        ) : tab === 'rounds' ? (
          tr.status === 'registration' ? (
            <Txt center color={t.colors.textMuted}>
              Pairings appear when the tournament starts.
            </Txt>
          ) : rounds.isPending ? (
            <Spinner />
          ) : tr.format === 'single_elimination' ? (
            <Bracket rounds={rounds.data ?? []} me={mine?.user_id ?? null} />
          ) : (
            <RoundList rounds={rounds.data ?? []} me={mine?.user_id ?? null} />
          )
        ) : (
          <InfoPanel tr={tr} />
        )}
      </ScrollView>
      {confirmLeave ? (
        <Confirm
        title="Withdraw?"
        message={
          tr.status === 'running'
            ? 'Your current pairing goes to your opponent and you can’t come back.'
            : 'You can join again while registration is open.'
        }
        confirmLabel="Withdraw"
        danger
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function MyMatchCard({ tr }: { tr: Tournament }) {
  const t = useTheme();
  const m = tr.my_match!;
  const waiting = m.status === 'waiting';
  return (
    <Card
      label={waiting ? 'Your match is ready. Check in.' : 'Your match is on'}
      onPress={() => router.push(`/match/${m.match_id}`)}
      style={{ backgroundColor: t.colors.primary, borderWidth: 0 }}
    >
      <Txt variant="title" color={t.colors.textOnPrimary}>
        {waiting ? 'Your match is ready' : 'Your match is on'}
      </Txt>
      <Txt color={t.colors.textOnPrimary}>
        {waiting && m.check_in_deadline
          ? `Check in ${relativeTime(m.check_in_deadline).replace('in ', 'within ')} or you’ll forfeit.`
          : 'Tap to jump back in.'}
      </Txt>
    </Card>
  );
}

function StandingsList({ rows, loading, tr }: { rows: Standing[]; loading: boolean; tr: Tournament }) {
  const t = useTheme();
  if (loading) return <Spinner />;
  if (!rows.length) {
    return (
      <Txt center color={t.colors.textMuted}>
        No players yet. Be the first!
      </Txt>
    );
  }
  const points = tr.format !== 'single_elimination';
  return (
    <Card style={{ gap: 0 }}>
      {rows.map((r) => {
        const out = ['withdrawn', 'disqualified'].includes(r.status);
        const isMe = r.user_id && r.user_id === tr.my_entry?.user_id;
        return (
          <Row
            key={`${r.user_id}-${r.position}`}
            onPress={r.user_id && !isMe ? () => router.push(`/player/${r.user_id}`) : undefined}
            leading={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                <Txt variant="bodyBold" style={{ width: 28 }} color={t.colors.textMuted}>
                  {r.final_rank ?? r.position}
                </Txt>
                <Initials name={r.display_name} size={34} />
              </View>
            }
            title={`${r.display_name}${isMe ? ' (you)' : ''}`}
            subtitle={
              out
                ? r.status === 'withdrawn'
                  ? 'Withdrew'
                  : 'Disqualified'
                : tr.status === 'registration'
                  ? `Rating ${r.rating}`
                  : `${r.wins}W ${r.losses}L${r.draws ? ` ${r.draws}D` : ''}${r.status === 'eliminated' ? ' · Out' : ''}`
            }
            trailing={points && tr.status !== 'registration' ? <Txt variant="bodyBold">{r.points} pts</Txt> : null}
          />
        );
      })}
    </Card>
  );
}

function PairingBox({ p, me, compact }: { p: Pairing; me: string | null; compact?: boolean }) {
  const t = useTheme();
  const game = [...p.games].reverse().find((g) => g.match_id);
  const side = (entry: Pairing['a'], wins: number | undefined) => {
    const won = !!entry?.user_id && p.winner_user_id === entry.user_id;
    const isMe = !!me && entry?.user_id === me;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingVertical: 6, paddingHorizontal: t.spacing.sm }}>
        <Txt variant="caption" color={t.colors.textMuted} style={{ width: 16 }}>
          {entry?.seed ?? ''}
        </Txt>
        <Txt
          variant={won ? 'bodyBold' : 'small'}
          numberOfLines={1}
          style={{ flex: 1 }}
          color={entry ? (isMe ? t.colors.primary : t.colors.text) : t.colors.textMuted}
        >
          {entry ? entry.display_name : p.status === 'completed' ? 'Bye' : 'To be decided'}
        </Txt>
        {p.b && entry ? (
          <Txt variant="bodyBold" color={won ? t.colors.success : t.colors.textMuted}>
            {wins ?? 0}
          </Txt>
        ) : null}
      </View>
    );
  };
  return (
    <Card
      label={`${p.a?.display_name ?? 'TBD'} versus ${p.b?.display_name ?? 'TBD'}`}
      onPress={game ? () => router.push(`/match/${game.match_id}`) : undefined}
      style={{ padding: 0, gap: 0, width: compact ? 200 : undefined }}
    >
      {side(p.a, p.a_wins)}
      <View style={{ height: 1, backgroundColor: t.colors.border }} />
      {side(p.b, p.b_wins)}
      {p.reason && p.reason !== 'played' && p.reason !== 'bye' ? (
        <Txt variant="caption" color={t.colors.textMuted} style={{ paddingHorizontal: t.spacing.sm, paddingBottom: 6 }}>
          {REASONS[p.reason] ?? p.reason}
        </Txt>
      ) : null}
    </Card>
  );
}

const REASONS: Record<string, string> = {
  no_show: 'Won on a no-show',
  double_no_show: 'Neither player checked in',
  withdrawal: 'Opponent withdrew',
  tiebreak: 'Decided by seed',
};

function Bracket({ rounds, me }: { rounds: Round[]; me: string | null }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.md }}>
      {rounds.map((r) => (
        <View key={r.number} style={{ gap: t.spacing.sm, justifyContent: 'space-around' }}>
          <Txt variant="caption" color={t.colors.textMuted} style={{ textTransform: 'uppercase', fontWeight: '800' }}>
            {r.name}
          </Txt>
          {r.pairings.map((p) => (
            <PairingBox key={p.position} p={p} me={me} compact />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function RoundList({ rounds, me }: { rounds: Round[]; me: string | null }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.lg }}>
      {[...rounds].reverse().map((r) => (
        <View key={r.number} style={{ gap: t.spacing.sm }}>
          <SectionTitle>{r.name}</SectionTitle>
          {r.pairings.map((p) => (
            <PairingBox key={p.position} p={p} me={me} />
          ))}
        </View>
      ))}
    </View>
  );
}

function InfoPanel({ tr }: { tr: Tournament }) {
  const t = useTheme();
  const minutes = Math.max(1, Math.round(tr.check_in_seconds / 60));
  return (
    <View style={{ gap: t.spacing.md }}>
      {tr.description ? <Txt>{tr.description}</Txt> : null}
      <Card>
        <SectionTitle>How it works</SectionTitle>
        <Txt variant="small" color={t.colors.textMuted}>
          {tr.format === 'single_elimination'
            ? 'Lose a pairing and you’re out. The last player standing wins.'
            : tr.format === 'round_robin'
              ? 'Everyone plays everyone. Win 1 point, draw ½.'
              : `${tr.total_rounds || 'A few'} rounds against players on the same score. Win 1 point, draw ½.`}
          {tr.best_of > 1 ? ` Each pairing is best of ${tr.best_of}.` : ''} When your match is ready you get a
          notification and have {minutes} min to press Ready.
        </Txt>
      </Card>
      {tr.rules_text ? (
        <Card>
          <SectionTitle>Rules</SectionTitle>
          <Txt variant="small">{tr.rules_text}</Txt>
        </Card>
      ) : null}
      {tr.prizes_text ? (
        <Card>
          <SectionTitle>Prizes</SectionTitle>
          <Txt variant="small">{tr.prizes_text}</Txt>
        </Card>
      ) : null}
      <Txt variant="small" color={t.colors.textMuted}>
        Code {tr.code}
      </Txt>
      {tr.organizer.website ? (
        <Btn label={`Visit ${tr.organizer.name}`} variant="secondary" onPress={() => Linking.openURL(tr.organizer.website)} />
      ) : null}
    </View>
  );
}
