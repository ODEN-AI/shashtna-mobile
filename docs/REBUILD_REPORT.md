# Shashtna mobile — rebuild report

Branches (not merged):
- Mobile: `ODEN-AI/shashtna-mobile` → `claude/charming-shannon-slvciw`
- Website/backend: `ODEN-AI/shashtna` → `feat/modern-shashtna-mobile`

## A. Audit (before)

**Mobile** — Expo SDK 57 / RN 0.86 / React 19, but the whole app was one
8,058-line `App.tsx` with one 4,700-line component:
- No navigation library (tab state in `useState`), no deep links.
- Raw `fetch` calls inside UI code, no typed API layer, no caching strategy.
- Notifications were local-only: the "read" state lived in AsyncStorage, not
  on the server. No push at all.
- Called `/api/apps`, which does not exist on the backend.
- Hard-coded `API_BASE_URL`, light UI mode, no RTL setup, no tests, no lint,
  no build profiles.
- Session token was already in SecureStore (the one good piece).

**Website/backend** (Next.js 16, Prisma Next 8, PostgreSQL) — well structured:
order state machine, order journey, manual payment + private proof storage,
subscription state, announcements/offers (`Announcement`), incidents,
in-app `Notification` table, staff roles/permissions, activity log, staff-
assisted password reset. Gaps for mobile: several mobile routes were thin
proxies, proof upload was server-action only (no API), no push, no device
tokens, admin could only message one customer in-app.

## B. Decision

- **Mobile: REBUILD.** Nothing in the monolith was worth preserving
  structurally; state, navigation, data access and notifications all had to
  change.
- **Backend: EXTEND.** The domain layer is sound; mobile APIs are built on
  the same services (orders, subscriptions, content, settings, tickets), so
  there is one order engine, one content system, one notification system.

## C. Mobile architecture

- **Navigation**: expo-router. `(auth)` group (login, register, reset) and
  `(app)` group guarded with `Stack.Protected`; 5 tabs (الرئيسية، الباقات،
  طلباتي، الإشعارات، حسابي) + detail screens. Scheme `shashtna://`.
- **State**: TanStack Query for all server state; React context only for
  session, push permission and toasts.
- **API**: `src/api/client.ts` (Bearer token, 20 s timeout, typed `ApiError`
  kinds, central 401 → sign-out, 5xx details hidden) + domain modules.
- **Auth**: same account as the website. Token in Keystore/Keychain;
  restored instantly, re-validated with `/api/mobile/me`; 30-day expiry
  checked on foreground.
- **Storage/caching**: non-secret queries persisted to AsyncStorage (24 h,
  busted per app version, cleared on logout). Subscription detail (IPTV
  credentials) and profile are memory-only. Refetch on focus/reconnect,
  retries only for network/5xx. No polling.
- **Push**: permission asked once after sign-in, Android channels
  (account / service / offers), Expo push token registered with the backend,
  token-change listener, foreground presentation, tap routing incl. cold
  start, unregister on logout.
- **Deep links**: typed `Destination` model; push payloads carry an internal
  link that is parsed against an allow-list; anything else opens the
  notification centre. Never opens arbitrary URLs.

## D. Website integration

Endpoints (all under `/api/mobile`, JSON envelope `{success, …}` /
`{success:false, code, message}`):

| Endpoint | Purpose |
| --- | --- |
| `POST auth/login`, `POST auth/register` | Same accounts; returns token |
| `POST auth/password-reset/request`, `…/complete` | Staff-assisted reset (same as website) |
| `GET/PATCH me`, `POST me/password` | Profile, contact + notification preferences |
| `GET dashboard` | Account state, featured subscription, current order, next action, unread count, offers, announcements, incidents |
| `GET catalog` | Active packages + compatible VIP devices |
| `GET/POST orders`, `GET orders/:id`, `POST orders/:id/cancel` | Order service of the website (server pricing, duplicate protection) |
| `GET/POST orders/:id/proof` | Proof upload (multipart) + owner-only proof image |
| `GET subscriptions`, `GET subscriptions/:id` | Derived state; credentials only on detail |
| `GET content`, `GET content/:id` | Offers (`AD`) and announcements (`ANNOUNCEMENT`), target `ALL`/`MOBILE` |
| `GET status` | Published incidents |
| `GET notifications`, `POST notifications/read` | Notification centre (cursor paging) |
| `POST/DELETE devices` | Push token registry |
| `GET/POST support/tickets`, `GET/POST support/tickets/:id` | Ticket service of the website |
| `GET help` | FAQ, troubleshooting, categories, support channels |
| `POST /api/cron/push` | Scheduler (CRON_SECRET) |

Database (additive migration `20260926T0111_mobile_push_notifications`):
new `pushDevice`, `pushCampaign`, `pushTicket`; nullable
`notification.imageUrl`, `notification.campaignId`. No existing data touched.

Sync: announcements/offers, notifications and incidents are read from the
same tables the website uses; nothing is copied.

## E. Admin notifications (`/admin/notifications`, «إشعارات الهواتف»)

- Create: title, message, type (8 types from existing business events),
  optional image (existing media upload), destination (typed), audience.
- Audiences: everyone, one customer (phone), active subscribers, expiring
  within 7 days, open orders, awaiting payment (no proof yet). Offers to
  groups only reach customers with the offers preference on.
- Send now / schedule (Baghdad time) / draft; send or cancel drafts and
  scheduled items; atomic claim prevents double sends.
- History with filters (all / scheduled / drafts / failed), per-campaign
  accounts, phones accepted/total, failures and last error; live reach
  preview per audience.
- Permissions (server-side): `notifications` (open page, one customer),
  `broadcast` (audiences). OWNER/ADMIN all; OPERATOR, CONTENT both; SUPPORT
  single customer only.
- Automatic notifications (order status, payment, activation, renewal,
  ticket replies) now also push.

## F. Mobile UX

Home answers "وضعي / طلبي / شنو لازم أسوي / الجديد": incident banner,
subscription hero (days left, progress, renew), one next-action card,
current order, push prompt when off, quick actions, offers carousel, news.
Packages (filters, offers), package detail + confirmation (VIP device
picker), order detail (journey, amount, copyable transfer number, recipient,
proof from gallery/camera compressed on device, reference, review state,
history, cancel, help), subscriptions (credentials hidden until "إظهار"),
notifications (unread, mark read/all, paging, detail), support (tickets,
reply/close, FAQ, WhatsApp/Telegram/phone), status, account (preferences,
password). Every data screen has loading skeletons, empty, error + retry and
an offline banner.

## G. Security

- Token only in Keystore/Keychain; passwords never stored.
- Every mobile route re-reads the account (deleted accounts lose access);
  ownership enforced server-side for orders, proofs, subscriptions, tickets.
- Admin permissions enforced in services, not only UI.
- Push tokens validated, bound to the signed-in account, moved on re-login,
  deactivated on logout and on `DeviceNotRegistered`.
- Deep links / push links: allow-listed internal paths only.
- IPTV credentials not in lists/dashboard and never persisted on the phone.
- Login compares against a dummy hash for unknown phones (no enumeration by
  timing); 5xx messages never shown to users; logs carry no personal data.
- Known limits: tokens are stateless (logout cannot revoke a stolen token
  before its 30-day expiry); no login rate limiting (pre-existing).

## H. Testing (what actually ran)

| Suite | Result |
| --- | --- |
| Website unit (`npm test`) | 34/34 pass (22 existing + destinations, audiences, payloads, permissions) |
| Website integration (`npm run test:integration`, real PostgreSQL 16) | 28/28 pass — auth, catalog, order create/duplicate/disabled plan, privacy, proof upload + validation, cancel, subscriptions, tickets, notifications, devices, campaigns, scheduling, cancel, stale tokens, status, acceptance 1–3 at API level |
| Mobile unit + screen flows (`npm test`) | 47/47 pass — deep-link parsing, API client errors/401/timeouts, cache policy, formatting, login → dashboard → packages → order → payment, push tap → destination + mark read, unsafe push link, signed-out deep link, expired session |
| **Website ↔ mobile acceptance** (`npm run test:backend`) | **4/4 pass** — real admin console in Chromium, real `next start` server, real DB, the app's own API modules; push captured at the Expo Push API boundary by a local recorder |
| Maestro device flows | Written, **not executed** (no emulator/device here) |

Not tested: delivery through real FCM/APNs to a phone (needs the EAS
project id + FCM credentials), iOS, and on-device rendering.

## I. Build

- Mobile: `tsc` clean, ESLint clean, `expo export --platform android`
  produces the Hermes bundle (3.6 MB), `expo prebuild` generates the native
  Android project (RTL forced, notification icon/colour, scheme, SecureStore
  backup rules). Gradle/APK not built: no Android SDK in this environment.
  `eas.json` has development / preview (APK) / production (AAB) profiles.
- Website: `tsc` clean, changed files lint clean (legacy admin lint errors
  pre-exist), `next build` succeeds.

## J. Before release

1. `eas init` (fills `extra.eas.projectId`) and upload FCM V1 credentials.
2. Apply the migration to production (additive; take a backup first).
3. Set `CRON_SECRET` on Netlify (and `EXPO_ACCESS_TOKEN` if enhanced push
   security is enabled).
4. Build a preview APK and run the Maestro flows on a real Android phone.
5. Font: the website uses Thmanyah Sans, whose licence says personal use
   only and forbids redistribution — the app uses system Arabic fonts for
   that reason; the website's use should be reviewed too.
