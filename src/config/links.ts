/** Every outside page the app opens. Google Play requires `privacy` and `accountDeletion`. */
export const LINKS = {
  website: 'https://example.com',
  privacy: 'https://example.com/privacy',
  terms: 'https://example.com/terms',
  support: 'mailto:support@example.com',
  accountDeletion: 'https://example.com/delete-account',
  /** Prefix of shared invites. Swap for your site once it can open the app (Android App Links). */
  invite: 'wordrivals://join/',
  /** Prefix of shared tournament links (the server builds the same one: TOURNAMENT_JOIN_URL). */
  tournament: 'wordrivals://tournament/',
  /** Page for websites and apps that want to run tournaments (the organizer guide). */
  organizers: 'https://example.com/organizers',
};
