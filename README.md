# Word Rivals

The Android app (iOS later) for Word Rivals, built with React Native and Expo.
The backend is [django-word-battle](https://github.com/NzeStan/django-word-battle) (0.2.0 or newer).

**What's in it:**
- **Play:** quick match, private challenges, practice against bots, the daily challenge and live matches.
- **Compete:** tournaments (join, check in, bracket, standings) and leaderboards.
- **Friends:** requests, player search and profiles, challenges, block and report.
- **Notifications:** an inbox, push notifications and per-topic settings.
- **Sign-in:** email, Google or GitHub.

## Change how it looks

Everything you'd swap lives in [`src/config/`](src/config). Screens never hold a link or a colour of their own.

| To change | Edit | Then |
|---|---|---|
| Logos, images, fonts, sounds | [`assets.ts`](src/config/assets.ts) | Nothing, the app follows |
| Colours, sizes, corners | [`theme.ts`](src/config/theme.ts) | Nothing, the app follows |
| Privacy, terms, support, organizer links | [`links.ts`](src/config/links.ts) | Nothing, the app follows |
| Error messages, tagline | [`strings.ts`](src/config/strings.ts) | Nothing, the app follows |
| Live API address | [`app.ts`](src/config/app.ts) | Nothing, the app follows |
| App icon, splash, notification icon, app name, package ID | [`native.json`](src/config/native.json) | `npm run assets:sync`, then a new build |

Point `CDN_BASE` in `assets.ts` at your CDN, or paste a full link into any entry.
A link that's empty or broken shows a themed block instead of a blank space, and an empty sound link stays silent.

Before a release, list everything still using a placeholder:

```
npm run check:placeholders
```

## Run it on your phone

1. Start the backend from the `django-word-battle` folder: `docker compose up -d`
2. Install **Expo Go** from the Play Store, on a phone on the same Wi-Fi as this computer.
3. From this folder:
   ```
   npm install
   npm start
   ```
4. Scan the QR code with Expo Go.

The app finds the backend on your computer by itself. If the phone can't connect, allow ports 8000 and 8081 through Windows Firewall.

Expo Go runs everything except push notifications. For those you need the app's own build (next section).

## Turn on Google and GitHub sign-in

The buttons appear on their own once the backend has the keys. No app change is needed.

1. **Google:**
   - In Google Cloud Console, go to APIs & Services, then Credentials, then Create credentials, then OAuth client ID. Choose **Web application**.
   - Authorised redirect URI: `https://<your server>/api/v1/auth/social/google/callback/`
2. **GitHub:**
   - Go to Settings, then Developer settings, then OAuth Apps, then New OAuth App.
   - Authorization callback URL: `https://<your server>/api/v1/auth/social/github/callback/`
3. Put the IDs and secrets in the backend's `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`), along with `PUBLIC_URL`, then restart it.

Google only accepts `https://` callbacks, apart from `localhost`. To try Google sign-in from a phone during development, put the backend behind a tunnel (for example `cloudflared tunnel --url http://localhost:8000`) and set `PUBLIC_URL` to the tunnel address. GitHub works with a plain local address.

## Build the Android app (needed for push notifications)

Builds run in Expo's cloud (EAS), so you don't need Android Studio.

1. `npm install -g eas-cli`, then `eas login`.
2. `eas init`, then copy the project ID it prints into `easProjectId` in [`native.json`](src/config/native.json).
3. **Push:**
   - Create a Firebase project, add an Android app with the package `com.nzestan.wordrivals`, and download `google-services.json` into this folder.
   - Then run `eas credentials` → Android → Push Notifications to upload an FCM V1 service-account key.
4. `eas build -p android --profile preview` gives you an APK to install. `--profile production` gives the Play Store bundle.

The backend sends pushes through Expo by default (`NOTIFICATION_BACKEND=...AutoBackend`), so there's nothing else to set up there.

## Links into the app

| Link | Opens |
|---|---|
| `wordrivals://join/<code>` | Join a friend's match |
| `wordrivals://tournament/<code>?ref=<id>` | A tournament. `ref` is passed to the organizer as `external_ref`. |
| `wordrivals://reset-password?uid=…&token=…` | Choose a new password |
| `wordrivals://verify-email?…` | Confirm an email address |

Links opened while signed out wait until the player signs in.

## Checks

```
npm run typecheck
npm test              # game rules and live match logic
npm run test:e2e      # plays real matches and a whole tournament against the running backend
```

## Where things are

| Folder | What's in it |
|---|---|
| `src/app/` | Screens. Each file is a route |
| `src/config/` | Everything you can swap |
| `src/game/` | Match state, word editing, and the game's components (board, keyboard, check-in) |
| `src/realtime/` | The reconnecting socket and personal events |
| `src/push/` | Push registration and where a tapped notification leads |
| `src/auth/` | Google / GitHub sign-in |
| `src/api/` | API client, token handling and response types |
| `src/state/` | Session, preferences, queries, toasts, sound and vibration |
| `src/ui/` | Shared buttons, cards, rows, fields and images |

The server decides every rule and result. The app only checks for obvious mistakes to save a round trip, and its clock never ends a turn.
