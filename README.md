# شاشتنا — Shashtna mobile app

The official Shashtna customer app for Android (and iOS). Arabic-first, RTL,
dark, built for phones. It is a client of the Shashtna website backend — the
single source of truth for accounts, packages, orders, payments,
subscriptions, announcements, offers, service status, support and
notifications. The app has no database and no business data of its own.

```
Admin (website) ──► Shashtna backend + PostgreSQL ──► website
                                   │
                                   ├──► /api/mobile/* ──► this app
                                   └──► Expo Push → FCM / APNs ──► phones
```

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React 19, TypeScript (strict) |
| Navigation | expo-router (file-based, typed routes, `shashtna://` deep links), protected route groups |
| Server state | TanStack Query 5 — cache, background refresh on focus/reconnect, retry policy, AsyncStorage persistence of non-secret data |
| Auth | Same account as the website; signed token in the Keystore/Keychain (expo-secure-store) |
| Push | expo-notifications + Expo Push Service (FCM on Android, APNs on iOS) |
| Images | expo-image (disk/memory cache), expo-image-picker + expo-image-manipulator for payment proofs |
| Tests | Jest (jest-expo) + React Native Testing Library + expo-router testing; Playwright-driven website↔mobile acceptance tests; Maestro device flows |

## Layout

| Path | Holds |
| --- | --- |
| `app/` | Routes. `(auth)` login/register/reset; `(app)/(tabs)` home, packages, orders, notifications, account; `(app)/*` detail screens |
| `src/api/` | Typed API client (`client.ts`) and one module per domain (auth, orders, notifications, support…). Screens never call `fetch` |
| `src/auth/` | Session store (SecureStore) and `AuthProvider` (restore, sign in/out, central 401 handling) |
| `src/push/` | Permission, channels, token registration, tap routing, cold start |
| `src/query/` | QueryClient, cache policy, data hooks and mutations |
| `src/lib/` | Pure logic: typed destinations/deep links, formatting, state labels |
| `src/ui/` | Design system (tokens in `theme.ts`, Text, Button, Card, Field, states, toast…) |
| `src/features/` | Composite pieces (subscription hero, next action, order card, offers…) |
| `__tests__/` | Unit and screen-flow tests (`npm test`) |
| `tests/backend/` | Website ↔ mobile acceptance tests (`npm run test:backend`) |
| `.maestro/` | Device E2E flows |

## Run it

```bash
npm install
npm start                      # dev server; open in a development build
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 npm start   # against a local website
```

The backend URL defaults to `https://shashtna.netlify.app` (`app.json →
extra.apiBaseUrl`). No secrets are compiled into the app.

Push notifications and the forced RTL layout need a **development build**
(`eas build --profile development`), not Expo Go.

## Push notifications — one-time setup

1. `eas init` → writes `extra.eas.projectId` into `app.json` (required for push tokens).
2. Android: upload the FCM V1 service-account key in EAS (`eas credentials`).
3. iOS (when shipping iOS): `eas credentials` creates the APNs key.
4. Website: optionally set `EXPO_ACCESS_TOKEN` if "Enhanced push security" is
   enabled on expo.dev; set `CRON_SECRET` on Netlify for scheduled sends.

Until step 1 is done the app runs normally but skips push registration
(logged as a warning).

## Checks

```bash
npm run typecheck
npm run lint
npm test                        # unit + screen flows
npm run export:android          # production JS bundle
npm run test:backend            # needs a running test website, see tests/backend/README.md
maestro test .maestro           # on a device/emulator with a test build
```

## Builds

```bash
eas build --profile preview --platform android      # installable APK
eas build --profile production --platform android   # Play Store AAB
```
