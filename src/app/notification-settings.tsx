import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Notifications } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import type { NotificationPrefs } from '@/api/types';
import { enablePush, pushPermission, pushSupported } from '@/push';
import { queryClient } from '@/state/session';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { Header } from '@/ui/bits';
import { Btn, Card, LoadError, SectionTitle, Spinner, Txt } from '@/ui/primitives';

const ROWS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'your_turn', label: 'Your turn', hint: 'When an opponent has moved or a match is found' },
  { key: 'challenges', label: 'Challenges', hint: 'When a friend challenges you' },
  { key: 'tournaments', label: 'Tournaments', hint: 'Check-in calls, byes and final results' },
  { key: 'friend_requests', label: 'Friend requests', hint: 'When someone wants to be your friend' },
  { key: 'match_results', label: 'Match results', hint: 'How finished matches went' },
  { key: 'rewards', label: 'Rewards', hint: 'Coins, XP and achievements' },
  { key: 'daily_reminder', label: 'Daily challenge', hint: 'A reminder when a new one is ready' },
];

export default function NotificationSettings() {
  const t = useTheme();
  const prefs = useQuery({ queryKey: ['notification-prefs'], queryFn: Notifications.prefs });
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined' | null>(null);
  const supported = pushSupported();

  useEffect(() => {
    void pushPermission().then(setPermission);
  }, []);

  const toggle = async (key: keyof NotificationPrefs, value: boolean) => {
    const previous = prefs.data;
    queryClient.setQueryData(['notification-prefs'], { ...previous, [key]: value });
    try {
      await Notifications.updatePrefs({ [key]: value });
    } catch (e) {
      queryClient.setQueryData(['notification-prefs'], previous);
      toast((e as ApiError).message, 'danger');
    }
  };

  const turnOn = async () => {
    const ok = await enablePush();
    const now = await pushPermission();
    setPermission(now);
    if (!ok && now === 'denied') void Linking.openSettings();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg }}>
        <Header title="Notification settings" />
        <Card>
          <SectionTitle>This device</SectionTitle>
          {!supported ? (
            <Txt variant="small" color={t.colors.textMuted}>
              Push notifications need the installed app (Expo Go can't receive them). Everything still shows up in
              your notification inbox.
            </Txt>
          ) : permission === 'granted' ? (
            <Txt variant="small" color={t.colors.success}>
              Push notifications are on.
            </Txt>
          ) : (
            <>
              <Txt variant="small" color={t.colors.textMuted}>
                Find out when it's your turn, when a friend challenges you and when your tournament match is ready.
              </Txt>
              <Btn label={permission === 'denied' ? 'Open settings' : 'Turn on notifications'} onPress={turnOn} />
            </>
          )}
        </Card>
        {prefs.isPending ? (
          <Spinner />
        ) : prefs.isError ? (
          <LoadError message={(prefs.error as ApiError).message} onRetry={() => prefs.refetch()} />
        ) : (
          <Card>
            <SectionTitle>Tell me about</SectionTitle>
            {ROWS.map((r) => (
              <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Txt>{r.label}</Txt>
                  <Txt variant="caption" color={t.colors.textMuted}>
                    {r.hint}
                  </Txt>
                </View>
                <Switch
                  accessibilityLabel={r.label}
                  value={!!prefs.data[r.key]}
                  onValueChange={(v) => toggle(r.key, v)}
                  thumbColor={prefs.data[r.key] ? t.colors.primary : t.colors.textMuted}
                  trackColor={{ true: t.colors.surfaceRaised, false: t.colors.border }}
                />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
