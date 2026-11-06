import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Friends, Matches, Players } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { ASSETS } from '@/config/assets';
import { useFriendRequests, useMe, useMeta } from '@/state/queries';
import { queryClient } from '@/state/session';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { Confirm } from '@/ui/Confirm';
import { Header, Initials, Row } from '@/ui/bits';
import { Btn, Card, Center, LoadError, RemoteImage, SectionTitle, Spinner, Txt } from '@/ui/primitives';

const REPORT_REASONS = [
  { key: 'cheating', label: 'Cheating or using a bot' },
  { key: 'abuse', label: 'Abusive behaviour' },
  { key: 'name', label: 'Offensive name' },
  { key: 'stalling', label: 'Stalling or unsporting play' },
  { key: 'other', label: 'Something else' },
];

export default function PlayerScreen() {
  const t = useTheme();
  const { id, challenge } = useLocalSearchParams<{ id: string; challenge?: string }>();
  const me = useMe();
  const requests = useFriendRequests();
  const player = useQuery({ queryKey: ['player', id], queryFn: () => Players.get(id!), enabled: !!id });
  const [busy, setBusy] = useState<string | null>(null);
  const [picking, setPicking] = useState(challenge === '1');
  const [reporting, setReporting] = useState(false);
  const [confirm, setConfirm] = useState<'block' | 'unfriend' | null>(null);

  if (player.isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
        <Center>
          <Spinner />
        </Center>
      </SafeAreaView>
    );
  }
  if (player.isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background, padding: t.spacing.lg }}>
        <Header title="Player" />
        <LoadError message={(player.error as ApiError).message} onRetry={() => player.refetch()} />
      </SafeAreaView>
    );
  }

  const p = player.data;
  const pending = (requests.data ?? []).find(
    (r) => (r.to_user.user_id === p.user_id || r.from_user.user_id === p.user_id) && r.status === 'pending',
  );
  const theyAsked = pending?.from_user.user_id === p.user_id;

  const run = async (key: string, fn: () => Promise<unknown>, done?: string) => {
    setBusy(key);
    try {
      await fn();
      if (done) toast(done, 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['friends'] }),
        queryClient.invalidateQueries({ queryKey: ['player', id] }),
      ]);
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg }}>
        <Header title={p.display_name} />
        <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
          <Initials name={p.display_name} size={88} />
          <Txt variant="heading" center>
            {p.display_name}
          </Txt>
          <Txt color={t.colors.textMuted}>
            Level {p.level}
            {p.country ? ` · ${p.country}` : ''}
            {p.is_friend ? ' · Friend' : ''}
          </Txt>
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <Btn label="Challenge" onPress={() => setPicking(true)} />
          {p.is_friend ? (
            <Btn label="Remove friend" variant="ghost" onPress={() => setConfirm('unfriend')} />
          ) : theyAsked && pending ? (
            <Btn
              label="Accept friend request"
              variant="secondary"
              loading={busy === 'accept'}
              onPress={() => run('accept', () => Friends.respond(pending.id, 'accept'), 'You are now friends')}
            />
          ) : pending ? (
            <Btn label="Friend request sent" variant="secondary" disabled />
          ) : (
            <Btn
              label="Add friend"
              variant="secondary"
              loading={busy === 'add'}
              onPress={() => run('add', () => Friends.request(p.user_id), 'Friend request sent')}
            />
          )}
        </View>

        {p.stats ? (
          <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat label="Played" value={p.stats.matches_played} />
            <Stat label="Wins" value={p.stats.wins} />
            <Stat label="Best streak" value={p.stats.best_win_streak} />
          </Card>
        ) : null}

        {p.ratings?.length ? (
          <Card>
            <SectionTitle>Ratings</SectionTitle>
            {p.ratings.map((r) => (
              <View key={r.pool} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt style={{ textTransform: 'capitalize' }}>{r.pool.replace(/-/g, ' ')}</Txt>
                <Txt variant="bodyBold">{Math.round(r.rating)}</Txt>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: t.spacing.lg }}>
          <Btn small variant="ghost" label="Report" onPress={() => setReporting(true)} />
          <Btn small variant="ghost" label="Block" onPress={() => setConfirm('block')} />
        </View>
      </ScrollView>

      {picking ? <ChallengeSheet userId={p.user_id} name={p.display_name} onClose={() => setPicking(false)} /> : null}
      {reporting ? <ReportSheet userId={p.user_id} name={p.display_name} onClose={() => setReporting(false)} /> : null}
      {confirm === 'block' ? (
        <Confirm
          title={`Block ${p.display_name}?`}
          message="They won’t be able to challenge you, find you or play you in matchmaking. You can unblock them later."
          confirmLabel="Block"
          danger
          busy={busy === 'block'}
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            run('block', () => Players.block(p.user_id), 'Blocked').then(() => {
              setConfirm(null);
              router.back();
            })
          }
        />
      ) : confirm === 'unfriend' ? (
        <Confirm
          title="Remove friend?"
          message={`${p.display_name} won’t be told.`}
          confirmLabel="Remove"
          danger
          busy={busy === 'unfriend'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => run('unfriend', () => Friends.remove(p.user_id)).then(() => setConfirm(null))}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt variant="title">{value}</Txt>
      <Txt variant="caption" color={t.colors.textMuted}>
        {label}
      </Txt>
    </View>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: t.colors.overlay }} />
      <View style={{ backgroundColor: t.colors.surface, padding: t.spacing.lg, paddingBottom: t.spacing.xxl, gap: t.spacing.md, maxHeight: '75%' }}>
        <Txt variant="title" accessibilityRole="header">
          {title}
        </Txt>
        {children}
      </View>
    </Modal>
  );
}

function ChallengeSheet({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const t = useTheme();
  const meta = useMeta();
  const me = useMe();
  const [busy, setBusy] = useState<string | null>(null);
  const modes = (meta.data?.modes ?? []).filter((m) => m.allow_private && m.format !== 'practice' && m.key !== 'daily' && m.max_players === 2);

  const go = async (mode: string) => {
    setBusy(mode);
    try {
      const match = await Matches.challenge(mode, [userId]);
      onClose();
      toast(`Challenge sent to ${name}`, 'success');
      router.push(`/match/${match.id}`);
    } catch (e) {
      toast((e as ApiError).message, 'danger');
      setBusy(null);
    }
  };

  return (
    <Sheet title={`Challenge ${name}`} onClose={onClose}>
      <Txt variant="small" color={t.colors.textMuted}>
        {name} gets a notification{me.data ? ` from ${me.data.display_name}` : ''}. Pick a mode:
      </Txt>
      <ScrollView contentContainerStyle={{ gap: t.spacing.sm }}>
        {modes.map((m) => (
          <Card key={m.key} label={m.name} onPress={busy ? undefined : () => go(m.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <RemoteImage uri={ASSETS.modes[m.key] ?? ASSETS.modes.default} label={m.name} style={{ width: 56, height: 40, borderRadius: t.radius.sm }} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold">{m.name}</Txt>
              <Txt variant="caption" color={t.colors.textMuted} numberOfLines={1}>
                {m.description}
              </Txt>
            </View>
            {busy === m.key ? <Spinner /> : null}
          </Card>
        ))}
      </ScrollView>
    </Sheet>
  );
}

function ReportSheet({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const send = async (reason: string) => {
    setBusy(true);
    try {
      await Players.report(userId, reason);
      toast('Thanks. Our moderators will take a look.', 'success');
      onClose();
    } catch (e) {
      toast((e as ApiError).message, 'danger');
      setBusy(false);
    }
  };
  return (
    <Sheet title={`Report ${name}`} onClose={onClose}>
      {REPORT_REASONS.map((r) => (
        <Row key={r.key} title={r.label} onPress={busy ? undefined : () => send(r.key)} />
      ))}
    </Sheet>
  );
}
