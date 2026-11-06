import Constants from 'expo-constants';

/**
 * Production API address. While developing, the app talks to the backend on the
 * computer running Expo, so testing on a real phone needs no setup.
 * EXPO_PUBLIC_API_URL overrides both.
 */
const PRODUCTION_API_URL = 'https://api.example.com';

function resolveApiUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    return `http://${host ?? 'localhost'}:8000`;
  }
  return PRODUCTION_API_URL;
}

export const API_URL = resolveApiUrl();
export const API_BASE = `${API_URL}/api/v1`;
export const WS_BASE = `${API_URL.replace(/^http/, 'ws')}/ws/v1`;

/** Shown until the server's name arrives. The server's GAME_NAME wins after that. */
export const FALLBACK_GAME_NAME = 'Word Rivals';

/** The mode behind the big Quick Match button. */
export const FEATURED_MODE = 'ranked';
