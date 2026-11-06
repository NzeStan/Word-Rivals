import { useFocusEffect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyChallenge, Matches } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { GameMode } from '@/api/types';
import { FEATURED_MODE } from '@/config/app';
import { ASSETS } from '@/config/assets';
import { MatchRow } from '@/game/components/ActiveMatchRow';
import { ModeSheet } from '@/game/components/ModeSheet';
import { useActiveMatches, useDaily, useGameName, useMe, useMeta } from '@/state/queries';
import { useSession } from '@/state/session';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { Btn, Card, Field, LoadError, RemoteImage, SectionTitle, Spinner, Txt } from '@/ui/primitives';

const HIDDEN_FROM_GRID = new Set(['daily', 'practice']);

export default function Home() {
  const t = useTheme();
  const name = useGameName();
  const meta = useMeta();
  const me = useMe();
  const active = useActiveMatches();
  const daily = useDaily();
  const [chosen, setChosen] = useState<GameMode | null>(null);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pendingInvite = useSession((s) => s.pendingInvite);

  useFocusEffect(
    useCallback(() => {
      void active.refetch();
      void daily.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    if (!pendingInvite) return;
    useSession.getState().setPendingInvite(null);
    router.push(`/join/${pendingInvite}`);
  }, [pendingInvite]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([meta.refetch(), active.refetch(), daily.refetch(), me.refetch()]);
    setRefreshing(false);
  };

  if (meta.isPending) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </SafeAreaView>
    );
  }
  if (meta.isError) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LoadError message={(meta.error as ApiError).message} onRetry={() => meta.refetch()} />
      </SafeAreaView>
    );
  }

  const modes = meta.data.modes.filter(
    (m) => !HIDDEN_FROM_GRID.has(m.key) && (m.key !== 'arena' || meta.data.feature_flags.arena),
  );
  const featured = meta.data.modes.find((m) => m.key === FEATURED_MODE && m.allow_matchmaking);
  const practice = meta.data.modes.find((m) => m.key === 'practice');
  const matches = active.data?.results ?? [];

  const openDaily = async () => {
    try {
      const today = daily.data;
      const match = today?.match_id ? { id: today.match_id } : await DailyChallenge.start();
      router.push(`/match/${match.id}`);
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          <RemoteImage uri={ASSETS.brand.logo} label={name} style={{ width: 44, height: 44, borderRadius: t.radius.sm }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt variant="title" numberOfLines={1}>
              {name}
            </Txt>
            <Txt variant="small" color={t.colors.textMuted} numberOfLines={1}>
              {me.data ? `${me.data.display_name} · Level ${me.data.level}` : ' '}
            </Txt>
          </View>
        </View>

        {featured ? (
          <Card
            label={`Quick match, ${featured.name}`}
            onPress={() => router.push({ pathname: '/matchmaking', params: { mode: featured.key } })}
            style={{ padding: 0, overflow: 'hidden', borderWidth: 0, gap: 0 }}
          >
            <RemoteImage uri={ASSETS.backgrounds.home} label="Quick match" style={{ height: 130 }} />
            <View style={{ padding: t.spacing.lg, backgroundColor: t.colors.primary }}>
              <Txt variant="heading" color={t.colors.textOnPrimary}>
                Quick match
              </Txt>
              <Txt color={t.colors.textOnPrimary}>
                {featured.name} · {featured.description}
              </Txt>
            </View>
          </Card>
        ) : null}

        {matches.length ? (
          <View style={{ gap: t.spacing.sm }}>
            <SectionTitle>Continue</SectionTitle>
            {matches.slice(0, 5).map((m) => (
              <MatchRow key={m.id} item={m} />
            ))}
          </View>
        ) : null}

        {meta.data.feature_flags.daily_challenge && daily.data ? (
          <Card
            label="Daily challenge"
            onPress={daily.data.result ? undefined : openDaily}
            style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}
          >
            <RemoteImage uri={ASSETS.modes.daily} label="Daily" style={{ width: 64, height: 64, borderRadius: t.radius.md }} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyBold">Daily challenge</Txt>
              <Txt variant="small" color={t.colors.textMuted}>
                {daily.data.result
                  ? `${daily.data.result.won ? 'Won' : 'Lost'} in ${daily.data.result.moves} moves. Back tomorrow!`
                  : daily.data.started
                    ? 'Finish today’s attempt'
                    : 'One attempt, same word for everyone'}
              </Txt>
            </View>
          </Card>
        ) : null}

        <View style={{ gap: t.spacing.sm }}>
          <SectionTitle>Game modes</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md }}>
            {modes.map((mode) => (
              <Card
                key={mode.key}
                label={`${mode.name}. ${mode.description}`}
                onPress={() => setChosen(mode)}
                style={{ flexBasis: '47%', flexGrow: 1, padding: 0, overflow: 'hidden', gap: 0 }}
              >
                <RemoteImage uri={ASSETS.modes[mode.key] ?? ASSETS.modes.default} label={mode.name} style={{ height: 84 }} />
                <View style={{ padding: t.spacing.md, gap: t.spacing.xs }}>
                  <Txt variant="bodyBold" numberOfLines={1}>
                    {mode.name}
                  </Txt>
                  <Txt variant="caption" color={t.colors.textMuted} numberOfLines={2}>
                    {mode.description}
                  </Txt>
                </View>
              </Card>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          {practice ? <Btn style={{ flex: 1, paddingHorizontal: 0 }} variant="secondary" label="Practice" onPress={() => setChosen(practice)} /> : null}
          <Btn style={{ flex: 1, paddingHorizontal: 0 }} variant="secondary" label="Join with code" onPress={() => setJoining(true)} />
        </View>
      </ScrollView>

      <ModeSheet mode={chosen} onClose={() => setChosen(null)} />
      {joining ? <JoinSheet onClose={() => setJoining(false)} /> : null}
    </SafeAreaView>
  );
}

function JoinSheet({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const match = await Matches.join(code.trim().toUpperCase());
      onClose();
      router.push(`/match/${match.id}`);
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
          Join a friend’s match
        </Txt>
        <Field
          label="Invite code"
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
