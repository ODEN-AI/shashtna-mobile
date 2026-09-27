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
| `app/` | Routes. `onboarding` (first launch only); `(auth)` login/register/reset; `(app)/(tabs)` home, packages, orders, notifications, account (guest-aware); `(app)/*` public detail screens; `(app)/(member)/*` account-only screens (checkout, orders, subscriptions, tickets…) |
| `src/api/` | Typed API client (`client.ts`) and one module per domain (auth, orders, notifications, support…). Screens never call `fetch` |
| `src/auth/` | Session store (SecureStore) and `AuthProvider` (restore, sign in/out, central 401 handling) |
| `src/push/` | Permission, channels, token registration, tap routing, cold start |
| `src/query/` | QueryClient, cache policy, data hooks and mutations |
| `src/lib/` | Pure logic: typed destinations/deep links, formatting, state labels |
| `src/ui/` | Shashtna Liquid Glass design system (tokens in `theme.ts`, gradients, GlassCard, Button, IconTile, StatusBadge, FilterChips, Field, states, toast…) — see `docs/UIUX_REDESIGN.md` |
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

## Push notifications and real-device testing

Push and the forced RTL layout need a real build (development client, preview
APK or production) — not Expo Go. Nothing secret is committed; `app.config.ts`
reads at build time:

| Variable | Purpose |
| --- | --- |
| `EAS_PROJECT_ID` | Expo project id (`eas init`), required for push tokens |
| `GOOGLE_SERVICES_JSON` | Path/EAS file variable with Firebase `google-services.json` (FCM) |
| `EXPO_PUBLIC_API_URL` | Optional backend override for test builds (e.g. a Netlify preview) |

Full procedure and results sheet: **[docs/REAL_DEVICE_TEST.md](docs/REAL_DEVICE_TEST.md)**.
Until `EAS_PROJECT_ID` is set the app runs but skips push registration
(visible in حسابي → فحص الإشعارات).

## Checks

```bash
npm run typecheck
npm run lint
npm test                        # unit + screen flows
npm run export:android          # production JS bundle
npm run test:backend            # website ↔ mobile acceptance (A–E); needs a running test website, see tests/backend/README.md
maestro test .maestro           # on a device/emulator with a test build
```

## Builds

```bash
eas build --profile preview --platform android      # installable APK
eas build --profile production --platform android   # Play Store AAB
```
