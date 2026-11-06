import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { ASSETS, type SoundName } from '@/config/assets';
import { usePrefs } from './prefs';

const players = new Map<SoundName, AudioPlayer>();

function playSound(name: SoundName) {
  const url = ASSETS.sounds[name];
  if (!url || !usePrefs.getState().sound) return;
  try {
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(url);
      players.set(name, player);
    }
    void player.seekTo(0);
    player.play();
  } catch {
    // A bad sound link must never interrupt the game.
  }
}

function buzz(kind: 'light' | 'medium' | 'success' | 'error') {
  if (Platform.OS === 'web' || !usePrefs.getState().haptics) return;
  const done =
    kind === 'light'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === 'medium'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : Haptics.notificationAsync(
            kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
          );
  done.catch(() => {});
}

export const feedback = {
  key: () => { buzz('light'); playSound('key'); },
  submit: () => { buzz('medium'); playSound('submit'); },
  invalid: () => { buzz('error'); playSound('invalid'); },
  yourTurn: () => { buzz('medium'); playSound('yourTurn'); },
  opponentMove: () => { playSound('opponentMove'); },
  tick: () => { buzz('light'); playSound('tick'); },
  win: () => { buzz('success'); playSound('win'); },
  lose: () => { buzz('error'); playSound('lose'); },
};
