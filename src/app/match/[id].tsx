import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Matches } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { ERROR_MESSAGES, REACTION_EMOJI } from '@/config/strings';
import { Board } from '@/game/components/Board';
import { ClockBar } from '@/game/components/ClockBar';
import { GameKeyboard } from '@/game/components/Keyboard';
import { Lobby } from '@/game/components/Lobby';
import { Players } from '@/game/components/Players';
import { ResultOverlay } from '@/game/components/ResultOverlay';
import { WordChain } from '@/game/components/WordChain';
import {
  allowedChanges,
  checkDraft,
  draftWord,
  erase,
  insertAt,
  newDraft,
  select,
  typeLetter,
  type Draft,
  type DraftContext,
} from '@/game/draft';
import { useMatchSession } from '@/game/useMatchSession';
import { feedback } from '@/state/feedback';
import { useMeta, useMode } from '@/state/queries';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { Confirm } from '@/ui/Confirm';
import { goHome } from '@/ui/goHome';
import { Btn, Center, Screen, Spinner, Txt } from '@/ui/primitives';

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const session = useMatchSession(id);
  const { match, moves, status, gone, reaction, clockOffsetMs } = session;
  const mode = useMode(match?.mode);
  const meta = useMeta();

  const [draft, setDraft] = useState<Draft>(() => newDraft(''));
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [resultHidden, setResultHidden] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);

  const leaveScreen = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const me = match?.participants.find((p) => p.seat === match.my_seat);
  const live = match?.status === 'active';
  const myTurn = !!live && match.turn_seat !== null && match.turn_seat === match.my_seat;

  const context = useMemo<DraftContext>(
    () => ({
      rules: match?.rules ?? {},
      locked: match?.locked_positions ?? [],
      powerLeft: me?.power_left ?? 0,
    }),
    [match?.rules, match?.locked_positions, me?.power_left],
  );

  // A new word or a new turn starts a fresh draft.
  const boardKey = `${match?.current_word}|${match?.move_count}|${match?.turn_seat}`;
  useEffect(() => {
    if (!match) return;
    setDraft(newDraft(match.current_word));
    setMessage(null);
    setSubmitting(false);
    setReactionsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardKey]);

  if (gone) {
    return (
      <Screen>
        <Center>
          <Txt center color={t.colors.textMuted}>
            This match isn’t available.
          </Txt>
          <Btn label="Go home" onPress={goHome} />
        </Center>
      </Screen>
    );
  }

  if (!match) {
    return (
      <Screen>
        <Center>
          <Spinner />
          <Txt color={t.colors.textMuted}>{status === 'reconnecting' ? 'Trying to reach the server…' : 'Joining the match…'}</Txt>
          {status === 'reconnecting' ? <Btn small variant="ghost" label="Back" onPress={leaveScreen} /> : null}
        </Center>
      </Screen>
    );
  }

  if (match.status === 'waiting') {
    return <Lobby match={match} onChanged={() => void session.refetch().catch(() => {})} />;
  }

  const finished = match.status === 'completed' || match.status === 'aborted';
  const check = checkDraft(draft, context);
  const interactive = myTurn && !submitting;
  const isPractice = match.visibility === 'practice' && match.mode !== 'daily';
  const hasHuman = match.participants.some((p) => !p.is_bot && p.seat !== match.my_seat);
  const allowed = allowedChanges(match.rules, match.current_word);

  const submit = async () => {
    if (!check.ok) {
      if (check.reason) setMessage(check.reason);
      setShakeKey((k) => k + 1);
      feedback.invalid();
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const outcome = await session.submitMove(draftWord(draft));
    if (!outcome.ok) {
      setSubmitting(false);
      setMessage(ERROR_MESSAGES[outcome.code] ?? outcome.message);
      setShakeKey((k) => k + 1);
      feedback.invalid();
      if (outcome.code === 'GAME_OVER' || outcome.code === 'NOT_YOUR_TURN') void session.refetch().catch(() => {});
    }
    // On success the turn.started event resets the board.
  };

  const askHint = async () => {
    setHintBusy(true);
    try {
      const hint = await Matches.hint(match.id);
      setMessage(hint.suggestion ? `Try ${hint.suggestion.toUpperCase()}` : 'No hint for this word.');
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setHintBusy(false);
    }
  };

  const resign = async () => {
    setConfirmResign(false);
    try {
      await Matches.resign(match.id);
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    }
  };

  const rulesHint = match.rules.add_remove
    ? 'change a letter, or add or remove one'
    : allowed > 1
      ? `change up to ${allowed} letters`
      : 'change 1 letter';
  const turnName = match.participants.find((p) => p.seat === match.turn_seat)?.display_name ?? 'Rival';
  const statusLine = finished
    ? 'Match over'
    : message
      ? message
      : myTurn
        ? submitting
          ? 'Checking…'
          : check.power
            ? 'Power move! This uses one of your power moves.'
            : `Your turn: ${rulesHint}`
        : `${turnName} is thinking…`;

  return (
    <Screen style={{ paddingHorizontal: t.spacing.md, paddingTop: t.spacing.sm, paddingBottom: t.spacing.sm, gap: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={leaveScreen}>
          <Ionicons name="chevron-back" size={26} color={t.colors.text} />
        </Pressable>
        <Txt variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
          {mode?.name ?? match.mode}
        </Txt>
        {status !== 'open' ? (
          <Txt variant="caption" color={t.colors.warning} accessibilityLiveRegion="polite">
            Reconnecting…
          </Txt>
        ) : null}
        {live && hasHuman ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send a reaction"
            hitSlop={10}
            onPress={() => setReactionsOpen((o) => !o)}
          >
            <Ionicons name="happy-outline" size={24} color={t.colors.textMuted} />
          </Pressable>
        ) : null}
        {live && me ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Resign" hitSlop={10} onPress={() => setConfirmResign(true)}>
            <Ionicons name="flag-outline" size={22} color={t.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Players match={match} reaction={reaction} />
      <ClockBar deadline={match.turn_deadline} turnSeconds={match.turn_seconds} offsetMs={clockOffsetMs} mine={myTurn} />

      {reactionsOpen ? (
        <Animated.View entering={FadeIn.duration(120)} style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {(meta.data?.reactions ?? []).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key.replace(/_/g, ' ')}
              hitSlop={4}
              onPress={() => {
                session.sendReaction(key);
                setReactionsOpen(false);
              }}
            >
              <Txt style={{ fontSize: 26 }}>{REACTION_EMOJI[key] ?? '👋'}</Txt>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <WordChain match={match} moves={moves} />

      <View style={{ minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.md }}>
        <Txt
          variant="small"
          center
          accessibilityLiveRegion="polite"
          color={message ? t.colors.danger : myTurn ? t.colors.success : t.colors.textMuted}
          style={{ fontWeight: '700', flexShrink: 1 }}
        >
          {statusLine}
        </Txt>
        {isPractice && myTurn ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Get a hint" disabled={hintBusy} onPress={askHint} hitSlop={8}>
            <Ionicons name="bulb-outline" size={20} color={t.colors.accent} />
          </Pressable>
        ) : null}
      </View>

      <Board
        draft={draft}
        context={context}
        interactive={interactive}
        shakeKey={shakeKey}
        onSelect={(i) => {
          setMessage(null);
          setDraft((d) => select(d, i, context));
        }}
        onInsert={(gap) => {
          setMessage(null);
          setDraft((d) => insertAt(d, gap, context));
        }}
      />

      {me ? (
        <GameKeyboard
          disabled={!interactive}
          canSubmit={check.ok}
          submitLabel={check.power ? 'Power' : 'Play'}
          onLetter={(letter) => {
            setMessage(null);
            setDraft((d) => typeLetter(d, letter, context));
          }}
          onErase={() => {
            setMessage(null);
            setDraft((d) => erase(d, context));
          }}
          onSubmit={submit}
        />
      ) : null}

      {finished && !resultHidden ? <ResultOverlay match={match} moves={moves} onDismiss={() => setResultHidden(true)} /> : null}

      {finished && resultHidden ? <Btn label="Done" onPress={leaveScreen} /> : null}

      {confirmResign ? (
        <Confirm
          title="Resign this match?"
          message="Your rival wins right away."
          confirmLabel="Resign"
          danger
          onConfirm={resign}
          onCancel={() => setConfirmResign(false)}
        />
      ) : null}
    </Screen>
  );
}
