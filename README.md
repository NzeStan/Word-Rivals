# Word Rivals

The Android app (iOS later) for Word Rivals, built with React Native and Expo.
The backend is [django-word-battle](https://github.com/NzeStan/django-word-battle).

## Change how it looks

Everything you'd swap lives in [`src/config/`](src/config). Screens never hold a link or a colour of their own.

| To change | Edit | Then |
|---|---|---|
| Logos, images, fonts, sounds | [`assets.ts`](src/config/assets.ts) | Nothing, the app follows |
| Colours, sizes, corners | [`theme.ts`](src/config/theme.ts) | Nothing, the app follows |
| Privacy, terms, support links | [`links.ts`](src/config/links.ts) | Nothing, the app follows |
| Error messages, tagline | [`strings.ts`](src/config/strings.ts) | Nothing, the app follows |
| Live API address | [`app.ts`](src/config/app.ts) | Nothing, the app follows |
| App icon, splash screen, app name, package ID | [`native.json`](src/config/native.json) | `npm run assets:sync`, then a new build |

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

## Checks

```
npm run typecheck
npm test              # game rules and live match logic
npm run test:e2e      # plays real matches against the running backend
```

## Where things are

| Folder | What's in it |
|---|---|
| `src/app/` | Screens. Each file is a route |
| `src/config/` | Everything you can swap |
| `src/game/` | Match state, word editing, and the game's components |
| `src/realtime/` | The reconnecting socket and personal events |
| `src/api/` | API client, token handling and response types |
| `src/state/` | Session, preferences, toasts, sound and vibration |
| `src/ui/` | Shared buttons, cards, fields and images |

The server decides every rule and result. The app only checks for obvious mistakes to save a round trip, and its clock never ends a turn.
