import { router } from 'expo-router';

/**
 * Back to the existing home screen, without stacking another.
 * Match screens always sit directly on home (matchmaking and rematch replace themselves),
 * so going back lands there. Opened from a link, there's nothing behind to return to.
 */
export function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
