import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { Devices } from '@/api/endpoints';
import { activePalette, palettes } from '@/config/theme';
import { openNotification } from './open';

/**
 * Push notifications through Expo's push service (the backend's AutoBackend sends them).
 *
 * Needs a development or store build: Expo Go on Android can't receive remote pushes.
 * The EAS project ID comes from native.json (easProjectId).
 */

const CHANNEL = 'default';
let registeredToken: string | null = null;

// While the app is open the live connection already shows a toast, so skip the system banner then.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const foreground = AppState.currentState === 'active';
    return { shouldShowBanner: !foreground, shouldShowList: true, shouldPlaySound: !foreground, shouldSetBadge: false };
  },
});

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId || Constants.easConfig?.projectId || undefined;
}

/** Whether this build can receive pushes at all. */
export function pushSupported(): boolean {
  if (Platform.OS === 'web' || !Device.isDevice) return false;
  if (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return false;
  return !!projectId();
}

export async function pushPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!pushSupported()) return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Game updates',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: palettes[activePalette].primary,
    vibrationPattern: [0, 200, 120, 200],
  });
}

async function tokenAndRegister(): Promise<boolean> {
  await ensureChannel();
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
  await Devices.register(data, Platform.OS === 'ios' ? 'ios' : 'android');
  registeredToken = data;
  return true;
}

/** Asks the player (if needed) and registers this device. Resolves false when not allowed or not possible. */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return false;
    return await tokenAndRegister();
  } catch {
    return false;
  }
}

/** Re-registers quietly at sign-in when permission was given before. Never prompts. */
export async function refreshPushRegistration() {
  if ((await pushPermission()) !== 'granted') return;
  await tokenAndRegister().catch(() => {});
}

/** Stops pushes to this device for the account that is signing out. */
export async function unregisterPush() {
  const token = registeredToken;
  registeredToken = null;
  if (token) await Devices.unregister(token).catch(() => {});
}

/** Opens the right screen when the player taps a notification, including one that launched the app. */
export function useNotificationTaps(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let handled: string | null = null;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response || response.notification.request.identifier === handled) return;
      handled = response.notification.request.identifier;
      openNotification(response.notification.request.content.data as Record<string, unknown>);
    };
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [enabled]);
}
