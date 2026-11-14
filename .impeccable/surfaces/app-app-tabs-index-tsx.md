---
version: 1
slug: "app-app-tabs-index-tsx"
primary_target: "app/(app)/(tabs)/index.tsx"
related_targets: []
---

# Surface: «اشتراكي» home and the thin app shell

Scope: the Shashtna customer app's native shell (Android, APK) — the «اشتراكي» home, renewal entry, order tracking, payment-proof upload, notifications, and the three-tab shell; website pages (store/checkout, points, chat, tickets) open inside the app. Visitor mode: Operate.

Audience and job: Iraqi Shashtna customers on everyday Android phones checking whether their subscription works, until when, renewing, paying by Qi card transfer, and knowing what happens after they upload the screenshot. Owner wants the pride of a big brand; never busy, dull, foreign or flashy.

## Direction contract

THESIS: Your subscription is a card in your hand — the «بطاقة شاشتنا» carries the days left like a recharge card's printed value, and renewing is topping it up. It refuses the category default of a greeting, a progress bar inside a grey card and a grid of shortcut tiles.

OWN-WORLD: Near-black ground (#0b0e17) with the website's brand blue (#2456e6) as the card's face and the active-tab pill; a matte card at true card proportions (85.6:54) with a soft top sheen, a silver scratch-band (#c9ced8) carrying the expiry date, and a small gold seal «ش» (#d9b46a) used only on the card. Light ice surface (#f4f6fb) for the single primary button. Status tones from one ramp: running blue, expiring amber, ended muted. 8-pt grid, 24-pt page margin.

STORY: The customer sees instantly what they have and until when, renews with one obvious button, and after paying always knows the order's stage and roughly how long it takes; help is one tab away.

FIRST VIEWPORT: Top row: greeting with name (start) and a 48-dp bell with unread dot (end). The Shashtna card full-width under it (216 dp tall): brand and plan chip on top, days-left numeral at display size (~76 sp) with «يوم باقي», silver band with the end date and the gold seal at the bottom. Then the full-width light «جدّد اشتراكك» button (56 dp) with the from-price. Then «طلبك الحالي»: one track with three stations (استلمنا الحوالة ← نتحقق منها ← نفعّل) and an honest wait line. Material bottom navigation: اشتراكي · المتجر · مساعدة.

FORM: Assigned grounded candidate 6 of 7 (Iraqi prepaid recharge / Qi card), raised by: one disciplined order track (transit); numerals over boxes (metro); one 8-pt grid and true card proportions (Crouwel); quiet ground, nothing labelled twice (Saville); status tones from one ramp (exposure record). seed:e2aef44ac73a8de0

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Card states: no subscription (choose a plan), expiring (amber band), ended (muted card, «جدّد» leads), several subscriptions (swipeable cards).
- Signature interaction: renewing tops the card up (the numeral counts up once on activation); reduced-motion falls back to an instant change.
