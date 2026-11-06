import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { create } from 'zustand';
import { activePalette, fontFamily, fontSize, palettes, radius, spacing, type Palette, type PaletteName } from '@/config/theme';

export type Theme = {
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fonts: typeof fontFamily;
};

export const useThemeStore = create<{
  name: PaletteName;
  fontsReady: boolean;
  setName: (name: PaletteName) => void;
  setFontsReady: (ready: boolean) => void;
}>((set) => ({
  name: activePalette,
  fontsReady: false,
  setName: (name) => set({ name }),
  setFontsReady: (fontsReady) => set({ fontsReady }),
}));

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const name = useThemeStore((s) => s.name);
  const value = useMemo<Theme>(
    () => ({ colors: palettes[name], spacing, radius, fontSize, fonts: fontFamily }),
    [name],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be inside ThemeProvider');
  return theme;
}

/** Builds styles from the theme: `const useStyles = makeStyles((t) => StyleSheet.create({...}))`. */
export function makeStyles<T>(factory: (theme: Theme) => T) {
  return () => {
    const theme = useTheme();
    return useMemo(() => factory(theme), [theme]);
  };
}
