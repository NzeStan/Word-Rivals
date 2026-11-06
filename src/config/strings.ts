/** Player-facing wording for the backend's error codes. Unknown codes use the server's message. */
export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK: "Can't reach the server. Check your connection and try again.",
  NOT_A_WORD: "That's not in our dictionary.",
  ALREADY_USED: 'That word has already been played.',
  NO_CHANGE: 'Change at least one letter.',
  TOO_MANY_CHANGES: "You've changed too many letters.",
  LENGTH_CHANGED: 'The word has to stay the same length in this mode.',
  LOCKED_POSITION: "You can't change the letter your rival just changed.",
  NO_POWER_MOVES_LEFT: 'You have no power moves left.',
  NOT_YOUR_TURN: "It's not your turn yet.",
  TOO_MANY_ATTEMPTS: 'Too many tries this turn. Think it over for a moment.',
  GAME_OVER: 'This match has finished.',
  AUTHENTICATION_FAILED: "That username and password don't match.",
  ACCOUNT_BANNED: 'This account has been banned.',
  ACCOUNT_SUSPENDED: 'This account is suspended for now.',
  THROTTLED: "You're going a bit fast. Try again in a moment.",
  INVITE_NOT_FOUND: "We couldn't find a match with that code.",
  MATCH_FULL: 'That match is already full.',
  MATCH_NOT_JOINABLE: "That match can't be joined any more.",
  ALREADY_IN_MATCH: "You're already in a match.",
  MATCHMAKING_UNAVAILABLE: "Matchmaking isn't available for this mode.",
  DAILY_DISABLED: "The daily challenge isn't available right now.",
};

export const END_REASONS: Record<string, string> = {
  no_legal_move: 'No legal moves left',
  timeout: 'Ran out of time',
  resigned: 'Resigned',
  move_cap: 'Move limit reached',
};

export const REACTION_EMOJI: Record<string, string> = {
  gg: '🤝',
  nice: '👏',
  wow: '😮',
  oops: '😅',
  thinking: '🤔',
  hurry: '⏰',
  good_luck: '🍀',
};

export const TAGLINE = 'Change a letter. Outwit your rival.';
