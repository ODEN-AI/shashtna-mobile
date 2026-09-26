# Shashtna mobile — final report

Branches (not merged, not pushed to main):
- Mobile `ODEN-AI/shashtna-mobile` → `claude/charming-shannon-slvciw`
- Website `ODEN-AI/shashtna` → `feat/modern-shashtna-mobile` (includes the
  latest `main`: restored checkout/dashboard layouts)

## A. Mobile audit (starting point)

Expo SDK 57 / RN 0.86 / React 19, but one 8,058-line `App.tsx` (one
4,700-line component): no navigation library, raw `fetch` in UI, hard-coded
URL, notification "read" state only on the phone, no push, a call to a
non-existent `/api/apps`, light theme, no RTL setup, no tests, no lint, no
build profiles. Token already in SecureStore. Security: no logout
revocation, no deep-link model. Performance: whole app re-rendered from one
component, no caching.

Website/backend: sound domain layer (order state machine, order journey,
manual transfer + private proofs, subscriptions, announcements, incidents,
notifications, roles). Gaps: no mobile API for proofs/checkout, no push,
no device registry, admin could only message one customer in-app, no login
throttling, tokens not revocable.

## B. Decision

**Mobile: rebuilt.** **Backend: extended** (all mobile endpoints reuse the
website's services — one order engine, one content system, one
notification system).

## C. Mobile architecture

- expo-router: `(auth)` / `(app)` groups with `Stack.Protected`; tabs
  الرئيسية · الباقات · طلباتي · الإشعارات · حسابي; `shashtna://` deep links.
- TanStack Query for server state; contexts only for session, push, toasts.
- Typed API client + domain modules (auth, dashboard, catalog, checkout,
  orders, subscriptions, content, status, notifications, devices, support).
- Session token in Keystore/Keychain; restore + background re-validation;
  central 401; fresh token after password change.
- Cache: non-secret queries persisted (24 h, per version, cleared on
  logout); credentials never persisted; refetch on focus/reconnect; no polling.
- Push: permission after sign-in, 3 Android channels, Expo token registered
  per account, token refresh, foreground/background/terminated taps,
  unregister on logout, in-app «فحص الإشعارات».
- Deep links: typed destinations, allow-listed; unknown → notification centre.
- Error boundary; last error (scrubbed) kept for support diagnostics.

**Purchase flow (matches the current website):** Packages → one package →
checkout (بيانات العميل، تفاصيل الباقة + VIP device، طريقة التواصل، ملاحظة،
ملخص الطلب) → confirm → **Dashboard** with «تم إنشاء طلبك ✅» and «طلب قيد
المتابعة» (journey, amount, transfer number + copy, recipient, proof upload
+ reference, review/paid state) → admin review → activation. VIP device
purchase, renew and upgrade use the same checkout.

## D. Website/backend

New: `src/server/checkout.ts` (shared by website checkout and
`/api/mobile/checkout`), `mobile.ts`, `mobile-api.ts`, `push.ts`,
`push-campaigns.ts`, `sessions.ts`, `login-guard.ts`, `lib/destinations.ts`,
`lib/push.ts`. Routes under `/api/mobile/*` (auth, me, dashboard, catalog,
checkout, orders + proof + cancel, subscriptions, content, status,
notifications, devices, support, help) and `/api/cron/push`.

Migrations (additive, applied on an existing database and verified):
- `20260926T0111_mobile_push_notifications`: `pushDevice`, `pushCampaign`,
  `pushTicket`; `notification.imageUrl`, `notification.campaignId`.
- `20260926T0213_user_session_security`: `user.tokenVersion`,
  `failedLogins`, `lockedUntil`.

Scheduler: Netlify scheduled function every 5 min → `/api/cron/push`
(scheduled campaigns, renewal reminders, receipt checks). Needs `CRON_SECRET`.

## E. Admin notifications («إشعارات الهواتف»)

Title, message, 8 types, optional image, audience (all, one customer,
active, expiring, open orders, awaiting payment), typed destination, send
now / schedule (Baghdad time) / draft, send or cancel drafts/scheduled,
history with filters and delivery counts/errors, reach preview. Server
permissions: `notifications` (one customer) and `broadcast` (audiences).
Offers to groups respect the customer's offers preference. Customer page
lists the customer's registered phones.

## F. Shared content

Announcements/offers = the website's `Announcement` records (target ALL or
MOBILE); edits, deactivation, expiry and deletion apply to both. Service
status = `ServiceIncident`. Notification centre = `Notification` records
(also on the website). Every automatic notification is pushed too.

## G. Shared customer data

Same `User` accounts, packages/prices/devices from the catalogue, the
website's `createOrder` (server pricing, duplicate protection, VIP
compatibility), the same order state machine and journey, manual payment
with private proof storage, same subscription derivation, same tickets.

## H. Security

Keystore token; ownership checks on orders, proofs, subscriptions,
tickets, devices; admin permissions in services; **login lockout** (5
failures → 15 min, same behaviour for unknown numbers); **session
revocation** (password change/reset and «تسجيل الخروج من كل الأجهزة» end
every other session and deactivate that account's phones); allow-listed
deep links; credentials only on subscription detail and never cached;
push tokens validated and bound to the signed-in account; logs without
personal data; no secrets in either repo (Firebase config and project id
come from build-time env).

## I. Testing — what actually ran

| Level | Suite | Result |
|---|---|---|
| A. Unit | Website `npm test` | 34/34 |
| A. Unit | Mobile `npm test` (pure + client + cache policy) | part of 47/47 |
| B. Integration | Website `npm run test:integration` (real PostgreSQL, push provider stubbed) | 36/36 |
| C. E2E (app) | Mobile screen flows: login → packages → checkout → dashboard payment; push tap; signed-out deep link; expired session (router + real components, fake backend) | part of 47/47 |
| C. E2E (systems) | `npm run test:backend`: real `next start` + real DB + real admin console in Chromium + the app's API modules; push provider = local recorder | **6/6** — A announcement, B offer, C order update, D payment through activation, E push (recorded), automatic push |
| D. Real device | Android build on a phone | **Not done** |
| E. Real push | Delivery via FCM to a phone | **Not done** |

## J. Build

Typecheck, lint, production Android JS bundle (Hermes, 3.6 MB) and native
Android project generation (`expo prebuild`: package
`app.shashtna.mobile`, RTL forced, notification icon/colour, `shashtna://`
scheme) succeed. EAS profiles: development (dev client APK), preview
(APK), production (AAB). **No APK was built here.**

## K. Limitations (not tested / not done)

- **No APK built, no phone test, no real push delivery.** This cloud
  environment blocks `dl.google.com` (Android SDK), `api.expo.dev` (EAS)
  and `exp.host` (Expo Push), and has no physical device. Follow
  `docs/REAL_DEVICE_TEST.md` and fill in its results sheet.
- iOS is configured but untested.
- Maestro flows in `.maestro/` are written but not run.
- Expo docs site blocked here; APIs were taken from the installed SDK 57
  packages' type definitions.
- Website's Thmanyah Sans licence (personal use, no redistribution) should
  be reviewed; the app uses system Arabic fonts.
- Campaign sending runs inside the admin request; very large audiences
  would warrant a background queue.
