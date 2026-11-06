/**
 * EVERY image, sound and font the app loads lives here, as a link.
 * Replace a link and the whole app follows. Nothing else in the code holds a URL.
 *
 * - Point CDN_BASE at your CDN, or paste a full URL into any entry.
 * - An empty string means "not provided": images show a themed fallback, sounds stay silent.
 * - `npm run check:placeholders` lists whatever you haven't replaced yet.
 *
 * The app icon and splash screen are in native.json because they're baked into the build.
 */
export const CDN_BASE = 'https://placehold.co';

/** Placeholder helper. Delete it once every link below is real. */
const ph = (w: number, h: number, label: string, bg = '2A2650', fg = 'FFFFFF') =>
  `${CDN_BASE}/${w}x${h}/${bg}/${fg}/png?text=${label.replace(/ /g, '+')}&font=montserrat`;

export const ASSETS = {
  brand: {
    logo: ph(512, 512, 'WR', '6C5CE7'),
    wordmark: ph(800, 200, 'Word Rivals', '14122B'),
  },

  backgrounds: {
    auth: ph(1080, 1920, 'Auth background', '14122B', '3A3570'),
    home: ph(1080, 600, 'Home hero', '6C5CE7', 'FFFFFF'),
  },

  illustrations: {
    victory: ph(600, 600, 'Victory', '1F6F54'),
    defeat: ph(600, 600, 'Defeat', '7A2E3A'),
    aborted: ph(600, 600, 'No contest', '3A3570'),
    searching: ph(600, 600, 'Searching', '3A3570'),
    invite: ph(600, 600, 'Invite a friend', '3A3570'),
    emptyMatches: ph(600, 400, 'No matches yet', '2A2650'),
    emptyFriends: ph(600, 400, 'Find your rivals', '2A2650'),
    emptyNotifications: ph(600, 400, 'All caught up', '2A2650'),
    emptyTournaments: ph(600, 400, 'No tournaments yet', '2A2650'),
    trophy: ph(400, 400, 'Champion', 'F9A825', '14122B'),
    notifications: ph(400, 400, 'Stay in the game', '6C5CE7'),
  },

  /** Shown when a tournament has no banner of its own. */
  tournamentBanner: ph(1080, 480, 'Tournament', '8E24AA'),

  /** One card image per game mode. Keys match the backend's mode keys. */
  modes: {
    classic: ph(600, 340, 'Classic', '3D5AFE'),
    blitz: ph(600, 340, 'Blitz', 'F4511E'),
    ranked: ph(600, 340, 'Ranked', '8E24AA'),
    'long-words': ph(600, 340, 'Long Words', '00897B'),
    'shape-shifter': ph(600, 340, 'Shape-shifter', 'D81B60'),
    'power-blitz': ph(600, 340, 'Power Blitz', 'F9A825', '14122B'),
    arena: ph(600, 340, 'Arena', '546E7A'),
    daily: ph(600, 340, 'Daily Challenge', '6C5CE7'),
    practice: ph(600, 340, 'Practice', '43A047'),
    default: ph(600, 340, 'Game mode', '3A3570'),
  } as Record<string, string>,

  avatars: {
    player: ph(256, 256, 'You', '6C5CE7'),
    opponent: ph(256, 256, 'Rival', 'F4511E'),
    bot: ph(256, 256, 'Bot', '546E7A'),
  },

  /** MP3 links. Empty stays silent; haptics still fire. */
  sounds: {
    key: '',
    submit: '',
    invalid: '',
    yourTurn: '',
    opponentMove: '',
    tick: '',
    win: '',
    lose: '',
  },

  /** TTF links, loaded at launch. If one fails, the app falls back to the system font. */
  fonts: {
    display: 'https://cdn.jsdelivr.net/fontsource/fonts/fredoka@latest/latin-700-normal.ttf',
    bodyRegular: 'https://cdn.jsdelivr.net/fontsource/fonts/nunito@latest/latin-600-normal.ttf',
    bodyBold: 'https://cdn.jsdelivr.net/fontsource/fonts/nunito@latest/latin-800-normal.ttf',
  },
};

export type SoundName = keyof typeof ASSETS.sounds;
