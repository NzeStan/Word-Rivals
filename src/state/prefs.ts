import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { activePalette, palettes, type PaletteName } from '@/config/theme';
import { useThemeStore } from '@/theme';

const KEY = 'word-rivals.prefs';
const persistent = Platform.OS === 'android' || Platform.OS === 'ios';

type Prefs = { palette: PaletteName; sound: boolean; haptics: boolean; pushPromptDismissed: boolean };

type PrefsState = Prefs & {
  load: () => Promise<void>;
  set: (patch: Partial<Prefs>) => void;
};

export const usePrefs = create<PrefsState>((set, get) => ({
  palette: activePalette,
  sound: true,
  haptics: true,
  pushPromptDismissed: false,
  load: async () => {
    if (!persistent) return;
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Prefs>;
      // A palette removed from the config falls back to the default.
      const palette = saved.palette && saved.palette in palettes ? saved.palette : activePalette;
      set({ ...saved, palette });
      useThemeStore.getState().setName(palette);
    } catch {
      // Unreadable prefs just mean defaults.
    }
  },
  set: (patch) => {
    set(patch);
    if (patch.palette) useThemeStore.getState().setName(patch.palette);
    if (persistent) {
      const { palette, sound, haptics, pushPromptDismissed } = get();
      SecureStore.setItemAsync(KEY, JSON.stringify({ palette, sound, haptics, pushPromptDismissed })).catch(() => {});
    }
  },
}));
