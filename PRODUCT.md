# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Shashtna customers in Iraq: Iraqi Arabic speakers, mostly on Android phones (many of them inexpensive), who
subscribe to Shashtna IPTV and, increasingly, VIP and digital-platform plans. They open this app to answer four
questions: *is my subscription working, when does it end, how do I pay to keep it, and did Shashtna receive my
transfer?* (owner and council, 2026-11-14). They watch on a separate app (Shashtna Player / Lite on TV boxes and
phones); this app is for their account.

## Product Purpose

The customer's Shashtna account in their pocket: see the subscription at a glance, renew in a few taps, pay and
upload the transfer proof without guessing, follow the order until it is activated, get notified (expiry,
payment confirmed, activation, replies), and reach help. Success means renewals happen on time without a
WhatsApp back-and-forth, and a customer always knows what happens next.

## Positioning

The official companion to a Shashtna subscription: the same account as the website, live data from Shashtna's own
system, and notifications on the phone. It is not a player and not a generic store.

## Operating Context

- **Distribution:** Android only, as an APK downloaded from Shashtna (website / WhatsApp), not Google Play (owner,
  2026-11-14). The app must be able to tell users an update is required, since an APK never updates itself. An older
  v1.0.0 build is already on some phones.
- **Payment:** manual. Customers pay mostly with a **Qi card** ("سوبر كي", also called "الماستر كارد") to the
  owner's account, then upload a screenshot (owner, 2026-11-14). Staff check it and activate; nothing activates
  automatically. Transfer details come from the website settings (`payment.transferNumber` and recipient name).
- **Backend:** the Shashtna website (`ODEN-AI/shashtna`) is the only source of truth: accounts, catalogue and prices,
  orders, proofs, subscriptions, loyalty points, notifications, tickets, the AI chat. The app talks to `/api/mobile/*`
  (additive-only contract) and has no data of its own.
- **Architecture (council decision, 2026-11-14):** a thin native app. Native: sign-in that stays signed in, the
  «اشتراكي» home (days left, end date, renew, current order status with an honest wait time), the payment-proof
  upload, push notifications, a link to Shashtna Player. Everything that changes often on the website (packages and
  checkout, points, AI chat, tickets) is shown from the website's My Shashtna inside the app, so the app never falls
  behind the site again.
- **Business stage:** about 65 customers, all IPTV, first renewals due December 2026. The owner runs everything
  himself with AI assistance.

## Capabilities and Constraints

- Expo SDK 57, React Native 0.86, React 19, TypeScript, expo-router, TanStack Query, expo-secure-store,
  expo-notifications (Expo Push; the website stores tokens since PR #32). Tests: Jest + React Native Testing Library.
- Prices, discounts, statuses and permissions are always decided by the website; the app never computes or trusts
  them. IPTV credentials appear only on the subscription detail.
- Android notification channels already used by the app: `account`, `service`, `offers`.
- The website's typeface (Thmanyah Sans) may not be bundled under its licence; the app uses system Arabic fonts
  unless a licence is obtained (open decision).
- Undecided: whether the in-app website pages need a dedicated "app" layout on the website side.

## Brand Commitments

- Name on the phone: **«شاشتنا»** (owner, 2026-11-14), the same as now.
- Arabic-first, right-to-left, dark, consistent with the Shashtna website (owner's standing direction).
- The official Shashtna logo (`assets/`); brand blue is the website's.
- Voice: plain, warm Iraqi Arabic; no database or internal words in the interface ("طلب" stages, "خيار", "نوع
  التسليم" are not customer words).

## Evidence on Hand

- Logo and icons in `assets/`; real catalogue, prices and content come live from the website.
- No user research, analytics, testimonials or install numbers exist. Do not invent them.

## Product Principles

1. The subscription is the home: what the customer has, until when, and one obvious way to keep it.
2. No guessing when paying: exact amount, where to send it, copy buttons, then one step to upload the proof.
3. Always say what happens next and roughly when, especially after a proof is uploaded.
4. One source of truth: anything the website already does well is shown from the website, not rebuilt.
5. Works on cheap phones and weak connections: light screens, clear offline states, nothing decorative that costs.

## Accessibility & Inclusion

Large tap targets and readable sizes for older customers; system font scaling respected; plain language; every
state (offline, loading, error, empty) explained in Arabic.
