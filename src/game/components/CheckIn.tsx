import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Matches } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { Match } from '@/api/types';
import { ASSETS } from '@/config/assets';
import { feedback } from '@/state/feedback';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { goHome } from '@/ui/goHome';
import { Initials } from '@/ui/bits';
import { Btn, Card, Center, RemoteImage, Screen, Txt } from '@/ui/primitives';

function useCountdown(deadline: string | null | undefined, offsetMs: number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setLeft(Math.max(0, new Date(deadline).getTime() - (Date.now() + offsetMs)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, offsetMs]);
  const s = Math.ceil(left / 1000);
  return { left, text: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` };
}

/** Waiting room for a tournament game: both players press Ready before the clock runs out. */
export function CheckIn({ match, clockOffsetMs, onChanged }: { match: Match; clockOffsetMs: number; onChanged: () => void }) {
  const t = useTheme();
  const info = match.tournament!;
  const [busy, setBusy] = useState(false);
  const { left, text } = useCountdown(info.check_in_deadline, clockOffsetMs);
  const me = match.participants.find((p) => p.seat === match.my_seat);
  const ready = new Set(info.ready_user_ids);
  const iAmReady = !!me?.user_id && ready.has(me.user_id);
  const spectator = !me;

  const checkIn = async () => {
    setBusy(true);
    try {
      await Matches.ready(match.id);
      feedback.submit();
      onChanged();
    } catch (e) {
      toast((e as ApiError).message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const score =
    info.best_of > 1 ? `Game ${info.game} · Best of ${info.best_of} · ${info.series.a_wins}–${info.series.b_wins}` : null;

  return (
    <Screen>
      <Center>
        <RemoteImage uri={ASSETS.illustrations.trophy} label="Tournament" style={{ width: 120, height: 120, borderRadius: t.radius.lg }} />
        <View style={{ alignItems: 'center', gap: t.spacing.xs }}>
          <Txt variant="small" color={t.colors.textMuted}>
            {info.name}
          </Txt>
          <Txt variant="heading" center accessibilityRole="header">
            {info.round_name}
          </Txt>
          {score ? (
            <Txt variant="small" color={t.colors.textMuted}>
              {score}
            </Txt>
          ) : null}
        </View>
        <Card style={{ alignSelf: 'stretch', gap: t.spacing.md }}>
          {match.participants.map((p) => {
            const isReady = !!p.user_id && ready.has(p.user_id);
            return (
              <View key={p.seat} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                <Initials name={p.display_name} />
                <Txt variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>
                  {p.seat === match.my_seat ? 'You' : p.display_name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name={isReady ? 'checkmark-circle' : 'time-outline'}
                    size={20}
                    color={isReady ? t.colors.success : t.colors.textMuted}
                  />
                  <Txt variant="small" color={isReady ? t.colors.success : t.colors.textMuted}>
                    {isReady ? 'Ready' : 'Not yet'}
                  </Txt>
                </View>
              </View>
            );
          })}
        </Card>
        {info.check_in_deadline ? (
          <View style={{ alignItems: 'center' }} accessibilityLiveRegion="polite">
            <Txt variant="display" color={left < 60000 ? t.colors.danger : t.colors.text}>
              {text}
            </Txt>
            <Txt variant="small" color={t.colors.textMuted} center>
              {left > 0
                ? 'If only one player is ready when this runs out, they win this game.'
                : 'Time’s up. Settling the result…'}
            </Txt>
          </View>
        ) : null}
      </Center>
      <View style={{ gap: t.spacing.md }}>
        {!spectator ? (
          <Btn
            label={iAmReady ? 'Waiting for your opponent…' : 'I’m ready'}
            loading={busy}
            disabled={iAmReady || left <= 0}
            onPress={checkIn}
          />
        ) : null}
        <Btn label="View tournament" variant="secondary" onPress={() => router.push(`/tournament/${info.id}`)} />
        <Btn label="Back" variant="ghost" onPress={goHome} />
      </View>
    </Screen>
  );
}
