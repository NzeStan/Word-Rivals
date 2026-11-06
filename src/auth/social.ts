import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Auth, type SocialProvider } from '@/api/endpoints';
import { ApiError } from '@/api/http';
import { API_BASE } from '@/config/app';
import { useSession } from '@/state/session';

void WebBrowser.maybeCompleteAuthSession();

/** Where the server sends the browser back to: wordrivals://auth in builds, exp://.../--/auth in Expo Go. */
export const SOCIAL_RETURN_URL = Linking.createURL('auth');

const SOCIAL_ERRORS: Record<string, string> = {
  not_configured: 'That sign-in option isn’t set up yet.',
  provider_error: 'The sign-in service didn’t respond. Please try again.',
  account_disabled: 'This account is disabled.',
  invalid_token: 'That sign-in couldn’t be verified. Please try again.',
};

/** Codes already traded for tokens, so the deep-link route and the browser result never both use one. */
const used = new Set<string>();

export async function finishSocialSignIn(code: string): Promise<boolean> {
  if (used.has(code)) return false;
  used.add(code);
  const tokens = await Auth.socialExchange(code);
  await useSession.getState().signInWithTokens(tokens);
  return true;
}

/** Opens the provider in a browser. Resolves true when signed in, false when the player backed out. */
export async function signInWith(provider: SocialProvider): Promise<boolean> {
  const start = `${API_BASE}/auth/social/${provider}/start/?redirect_uri=${encodeURIComponent(SOCIAL_RETURN_URL)}`;
  const result = await WebBrowser.openAuthSessionAsync(start, SOCIAL_RETURN_URL);
  if (result.type !== 'success') return false;
  const { queryParams } = Linking.parse(result.url);
  const error = typeof queryParams?.error === 'string' ? queryParams.error : null;
  if (error === 'cancelled') return false;
  if (error) throw new ApiError(error.toUpperCase(), SOCIAL_ERRORS[error] ?? 'Sign-in failed. Please try again.', 400);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
  if (!code) throw new ApiError('NO_CODE', 'Sign-in failed. Please try again.', 400);
  await finishSocialSignIn(code);
  return true;
}
