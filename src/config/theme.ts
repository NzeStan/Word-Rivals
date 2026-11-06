/**
 * EVERY colour, font size, corner radius and spacing value lives here.
 * Change a value and the whole app follows; screens never contain a colour of their own.
 * `activePalette` is the default look. Players can switch in Profile > Appearance.
 *
 * The splash screen background is in native.json because it's baked into the build.
 */
export type Palette = {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  primary: string;
  primaryPressed: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
  tile: string;
  tileText: string;
  tileEdge: string;
  tileChanged: string;
  tileChangedText: string;
  tileChangedEdge: string;
  tileSelected: string;
  tileLocked: string;
  tileLockedText: string;
  key: string;
  keyText: string;
  overlay: string;
};

export const palettes = {
  midnight: {
    isDark: true,
    background: '#14122B',
    surface: '#1F1C3D',
    surfaceRaised: '#2A2650',
    border: '#3A3570',
    text: '#F5F3FF',
    textMuted: '#A9A4CF',
    textOnPrimary: '#FFFFFF',
    primary: '#6C5CE7',
    primaryPressed: '#5546C9',
    accent: '#FFB020',
    success: '#2ECC8F',
    danger: '#FF5A6E',
    warning: '#FFB020',
    tile: '#F5F3FF',
    tileText: '#14122B',
    tileEdge: '#B9B3E6',
    tileChanged: '#FFB020',
    tileChangedText: '#14122B',
    tileChangedEdge: '#C7860F',
    tileSelected: '#6C5CE7',
    tileLocked: '#3A3570',
    tileLockedText: '#A9A4CF',
    key: '#2A2650',
    keyText: '#F5F3FF',
    overlay: 'rgba(10, 8, 28, 0.86)',
  },
  daylight: {
    isDark: false,
    background: '#F4F2FF',
    surface: '#FFFFFF',
    surfaceRaised: '#EBE8FF',
    border: '#D6D1F5',
    text: '#1B1838',
    textMuted: '#625D8C',
    textOnPrimary: '#FFFFFF',
    primary: '#5A4AD9',
    primaryPressed: '#4638B5',
    accent: '#B86E00',
    success: '#118A5C',
    danger: '#D92D45',
    warning: '#B86E00',
    tile: '#FFFFFF',
    tileText: '#1B1838',
    tileEdge: '#C4BEEB',
    tileChanged: '#FFB020',
    tileChangedText: '#1B1838',
    tileChangedEdge: '#C7860F',
    tileSelected: '#5A4AD9',
    tileLocked: '#DAD6F3',
    tileLockedText: '#625D8C',
    key: '#FFFFFF',
    keyText: '#1B1838',
    overlay: 'rgba(27, 24, 56, 0.78)',
  },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;

export const activePalette: PaletteName = 'midnight';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };
export const fontSize = { caption: 12, small: 14, body: 16, title: 20, heading: 28, display: 40 };

/** Names of the fonts loaded from ASSETS.fonts. */
export const fontFamily = { display: 'display', regular: 'bodyRegular', bold: 'bodyBold' };
