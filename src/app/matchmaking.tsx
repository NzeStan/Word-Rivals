import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Matchmaking } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { ASSETS } from '@/config/assets';
import { useLastUserEvent } from '@/realtime/useUserEvents';
import { useMode } from '@/state/queries';
import { useTheme } from '@/theme';
import { Btn, Center, RemoteImage, Screen, Txt } from '@/ui/primitives';

const POLL_MS = 3000;

export default function MatchmakingScreen() {
  const t = useTheme();
  const { mode: modeKey } = useLocalSearchParams<{ mode: string }>();
  const mode = useMode(modeKey);
  const [error, setError] = useState<string>();
  const [seconds, setSeconds] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const lastEvent = useLastUserEvent((s) => s.event);
  const finished = useRef(false);
  const startedAt = useRef(lastEvent);
  const pulse = useSharedValue(1);

  const enter = (matchId: string) => {
    if (finished.current) return;
    finished.current = true;
    router.replace(`/match/${matchId}`);
  };

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.08, { duration: 700 }), -1, true);
  }, [pulse]);
  const pulsing = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // Join the queue, then poll as a backup in case the socket misses match.found.
  useEffect(() => {
    if (!modeKey) return;
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const check = async () => {
      try {
        const ticket = await Matchmaking.status();
        if (stopped) return;
        if (ticket.match_id && ticket.status === 'matched') enter(ticket.match_id);
        else if (ticket.status === 'expired') setError('No rivals right now. Try again in a moment.');
      } catch {
        // A failed poll isn't fatal. The next one retries.
      }
    };
    Matchmaking.join(modeKey)
      .catch((e: ApiError) => {
        if (e.code !== 'ALREADY_QUEUED') throw e;
      })
      .then(() => {
        if (!stopped) timer = setInterval(check, POLL_MS);
      })
      .catch((e: ApiError) => setError(e.message));
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey, attempt]);

  useEffect(() => {
    if (!lastEvent || lastEvent === startedAt.current) return;
    if (lastEvent.type === 'match.found') enter(lastEvent.data.match_id);
    if (lastEvent.type === 'matchmaking.expired') setError('No rivals right now. Try again in a moment.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  const cancel = () => {
    finished.current = true;
    Matchmaking.leave().catch(() => {});
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen>
      <Center>
        <Animated.View style={pulsing}>
          <RemoteImage
            uri={ASSETS.illustrations.searching}
            label="Searching"
            style={{ width: 180, height: 180, borderRadius: t.radius.lg }}
          />
        </Animated.View>
        {error ? (
          <>
            <Txt center accessibilityLiveRegion="polite">
              {error}
            </Txt>
            <Btn
              label="Try again"
              onPress={() => {
                setError(undefined);
                setSeconds(0);
                setAttempt((a) => a + 1);
              }}
            />
          </>
        ) : (
          <View style={{ gap: t.spacing.xs, alignItems: 'center' }}>
            <Txt variant="heading" center>
              Finding a rival…
            </Txt>
            <Txt center color={t.colors.textMuted}>
              {mode?.name ?? modeKey} · {seconds}s
            </Txt>
          </View>
        )}
      </Center>
      <Btn variant="secondary" label="Cancel" onPress={cancel} />
    </Screen>
  );
}
