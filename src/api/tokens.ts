import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Tokens } from './types';

const KEY = 'word-rivals.tokens';
const persistent = Platform.OS === 'android' || Platform.OS === 'ios';

let cached: Tokens | null = null;

export async function loadTokens(): Promise<Tokens | null> {
  if (!persistent) return cached;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    cached = raw ? JSON.parse(raw) : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function currentTokens(): Tokens | null {
  return cached;
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  cached = tokens;
  if (persistent) await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  cached = null;
  if (persistent) await SecureStore.deleteItemAsync(KEY);
}

/** Seconds until a JWT expires, or null if it can't be read. */
export function secondsUntilExpiry(jwt: string): number | null {
  try {
    const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' ? exp - Date.now() / 1000 : null;
  } catch {
    return null;
  }
}
