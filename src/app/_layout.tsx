import { QueryClientProvider } from '@tanstack/react-query';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ASSETS } from '@/config/assets';
import { useUserEvents } from '@/realtime/useUserEvents';
import { usePrefs } from '@/state/prefs';
import { queryClient, useSession } from '@/state/session';
import { ThemeProvider, useTheme, useThemeStore } from '@/theme';
import { ToastHost } from '@/ui/ToastHost';

void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Fonts come from links, so a slow or dead link must never hold up the app. */
const FONT_WAIT_MS = 1500;

function loadFonts(): Promise<unknown> {
  const load = Font.loadAsync(ASSETS.fonts)
    .then(() => useThemeStore.getState().setFontsReady(true))
    .catch(() => {});
  return Promise.race([load, new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS))]);
}

function Navigator() {
  const t = useTheme();
  const status = useSession((s) => s.status);
  const signedIn = status === 'signedIn';
  useUserEvents();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(t.colors.background).catch(() => {});
  }, [t.colors.background]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <StatusBar style={t.colors.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background }, animation: 'slide_from_right' }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="match/[id]" />
          <Stack.Screen name="matchmaking" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen name="join/[code]" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="verify-email" />
      </Stack>
      <ToastHost />
    </View>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([loadFonts(), usePrefs.getState().load(), useSession.getState().bootstrap()]).finally(() => {
      setReady(true);
      void SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Navigator />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
