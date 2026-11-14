---
name: Shashtna (شاشتنا) customer app
description: The customer's Shashtna subscription as a card in hand. Arabic-first, right-to-left, dark, Android.
colors:
  night-canvas: "#0B0E17"
  nav-night: "#10131D"
  surface: "#121622"
  surface-2: "#151A26"
  surface-3: "#1D2232"
  line: "#1D2232"
  line-strong: "#2A3142"
  ink: "#F4F6FB"
  ink-2: "#AAB2C5"
  ink-3: "#8A92A6"
  ink-on-light: "#0B0E17"
  shashtna-blue: "#2456E6"
  brand-ink: "#A8C0FF"
  card-face-ink: "#E3EAFF"
  ice: "#F4F6FB"
  scratch-silver: "#C9CED8"
  seal-gold: "#D9B46A"
  expiring-amber: "#F5B14A"
  ended-slate: "#6B7385"
  success: "#4ADE80"
  danger: "#F87171"
  info: "#7FA0FF"
typography:
  display:
    fontFamily: "system-ui, 'Noto Sans Arabic', sans-serif"
    fontSize: "76px"
    fontWeight: 800
    lineHeight: "84px"
    letterSpacing: "-2px"
    fontFeature: "tnum"
  hero:
    fontFamily: "system-ui, 'Noto Sans Arabic', sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: "42px"
  title:
    fontFamily: "system-ui, 'Noto Sans Arabic', sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: "34px"
  heading:
    fontFamily: "system-ui, 'Noto Sans Arabic', sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: "26px"
  body:
    fontFamily: "system-ui, 'Noto Sans Arabic', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: "system-ui, 'Noto Sans Arabic', sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "20px"
  caption:
    fontFamily: "system-ui, 'Noto Sans Arabic', sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "18px"
rounded:
  xs: "6px"
  lg: "16px"
  xl: "20px"
  xxl: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "40px"
components:
  button-light:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.ink-on-light}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "56px"
  button-primary:
    backgroundColor: "{colors.shashtna-blue}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "52px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.brand-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  subscription-card:
    backgroundColor: "{colors.shashtna-blue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  subscription-card-ended:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.xl}"
  card-band:
    backgroundColor: "{colors.scratch-silver}"
    textColor: "{colors.ink-on-light}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "6px 12px"
  card-band-expiring:
    backgroundColor: "{colors.expiring-amber}"
    textColor: "{colors.ink-on-light}"
  card-band-ended:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
  plan-chip:
    textColor: "{colors.card-face-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  card-seal:
    textColor: "{colors.seal-gold}"
    rounded: "{rounded.pill}"
    size: "36px"
  nav-bar:
    backgroundColor: "{colors.nav-night}"
    textColor: "{colors.ink-3}"
    typography: "{typography.caption}"
    height: "80px"
  nav-indicator-active:
    backgroundColor: "rgba(36, 86, 230, 0.28)"
    textColor: "{colors.ink}"
    rounded: "16px"
    width: "64px"
    height: "32px"
  list-row:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "12px 0"
    height: "56px"
  settings-group:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
  update-banner:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  icon-button-bell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "48px"
---

# Design System: Shashtna (شاشتنا) customer app

<!-- Recorded from the shipped code on branch feat/thin-app, commit 88d10ab (src/ui/theme.ts, src/ui/Text.tsx, src/ui/*, src/features/*, app/(app)/(tabs)/*). No device screenshots were captured for this pass: no device or emulator was available, so every value here is read from source, not from rendered pixels. -->

## Overview

**Creative North Star: "The Card in Your Hand"**

The app is a quiet, flat night ground with one object of colour on it: the «بطاقة شاشتنا», the customer's subscription drawn as a real prepaid card. The card carries the days left like a recharge card's printed value, the end date on a silver scratch-band, and a small gold «ش» seal. Renewing is topping the card up. Everything around the card stays deliberately calm: tonal dark surfaces, hairline borders, system Arabic type, one light button for the one action that matters.

Density is low and vertical. Each tab is a single column on a 24 dp page margin with 24 dp between blocks, read top to bottom in right-to-left order: greeting and bell, the card, the renew button, the order track. Website pages (store, checkout, points, chat, tickets) render inside the app on the same night canvas, so the native shell only has to do the few things that are native.

The earlier "Liquid Glass" world (floating tab bar, gradient surfaces, glows, the spotlight carousel) is still in the repository (`FloatingTabBar`, `GradientSurface`, `spotlight/*`, `SubscriptionHero`) but the three main tabs no longer use it. It is not part of this system.

**Key Characteristics:**
- Flat night canvas; colour comes from the card, not the background.
- The subscription card at true card proportions (85.6 : 54) is the signature object.
- One ice-white hero button per screen; everything else is quieter.
- Status speaks through one ramp: running blue, expiring amber, ended slate.
- Depth by tonal steps and 1 dp hairlines, never shadows, on the main tabs.
- System Arabic font (Noto Sans Arabic on Android); the website's Thmanyah Sans is not bundled because its licence does not allow it.

## Colors

A near-black blue-tinted ground, the website's brand blue reserved for the card face and active states, and three small card materials (ice, silver, gold).

### Primary
- **Shashtna Blue** (shashtna-blue): the face of the subscription card, the solid primary button, the filled order-track stations and rail, the nav badge. Translucent at 0.25 to 0.28 alpha it becomes the active-tab indicator and the current-station halo.
- **Brand Ink** (brand-ink): blue for text and icons on the night canvas: ghost buttons, the "see all subscriptions" link, loaders, the unread dot on the bell.

### Secondary
- **Ice** (ice): the fill of the one hero button (renew, sign in, download update), with night text on it. Shares its value with ink by design.
- **Scratch Silver** (scratch-silver): the card's bottom band carrying the end date, and the band of the card corner that peeks into the sign-in scene.

### Tertiary
- **Seal Gold** (seal-gold): the 1.5 dp ring and «ش» of the card's seal. Nowhere else.

### Neutral
- **Night Canvas** (night-canvas): every screen and every in-app website page background; identical to the website's canvas.
- **Nav Night** (nav-night): the bottom navigation bar only, one step lifted from the canvas.
- **Surface / Surface 2 / Surface 3** (surface, surface-2, surface-3): standard cards and settings panels, secondary buttons, then banners and the ended card's face.
- **Line / Line Strong** (line, line-strong): hairlines and dividers; the stronger step for secondary-button borders, the dashed empty card, and the unfilled order-track rail.
- **Ink / Ink 2 / Ink 3** (ink, ink-2, ink-3): primary text, secondary text, and captions/inactive icons (about 17.4 : 1, 9.1 : 1 and 6.0 : 1 on the canvas).
- **Card Face Ink** (card-face-ink): solid light ink for the plan chip and «يوم باقي» on the blue face (about 4.9 : 1 on Shashtna Blue).
- **Status** (expiring-amber, ended-slate, success, danger, info): the status ramp and feedback tones; badges and icon wells use them at 0.10 to 0.22 alpha over the surface.

### Named Rules
**The Card Carries the Colour Rule.** The canvas is flat night with no gradient, glow or ambient light. Saturated colour on the home screen belongs to the subscription card.

**The Gold Seal Rule.** Seal Gold appears only on the card's seal (including the empty card). It is never a button, badge, border or text colour elsewhere.

**The One Ramp Rule.** Subscription state is told with one ramp: running is Shashtna Blue, expiring turns the silver band amber, ended fades the whole card to Surface 3 with Ended Slate. Never introduce a separate colour per state elsewhere.

## Typography

**Display Font:** system Arabic (Noto Sans Arabic on Android, SF Arabic on iOS)
**Body Font:** the same system family

**Character:** one plain, well-hinted family in heavy and regular weights. Hierarchy comes from size and weight jumps, not from a second face. Text scales with the system setting up to 1.4x; the card's text is capped at 1.15x and its numeral at 1x so the card keeps its proportions.

### Hierarchy
- **Display** (800, 76px, 84px line, -2px tracking, tabular numerals): the days-left number on the card. Only there.
- **Hero** (800, 32px, 42px): «انتهى» on an ended card.
- **Title** (800, 24px, 34px): the screen title and the customer's name in the home header.
- **Heading** (700, 17px, 26px): «شاشتنا» on the card, «طلبك الحالي», web-page bar titles.
- **Body** (400, 15px, 24px): explanations and the honest wait line.
- **Label** (700, 13px, 20px): list-row titles, button labels (set at 15.5px, 17px on the 56 dp button, 13.5px compact), the card's date band.
- **Caption** (500, 12px, 18px): greeting, subtitles, settings-group titles, nav labels.

### Named Rules
**The Numerals Over Boxes Rule.** A quantity the customer cares about (days left) is set as a large tabular numeral with its word beside it, never inside a progress bar or boxed tile.

**The System Arabic Rule.** Use the platform's Arabic system font. Do not bundle Thmanyah Sans or any substitute display face unless a licence is obtained.

## Layout

Single column, right-to-left. Tab screens use a 24 dp page margin (`xl`), start 16 dp below the status-bar inset, and separate blocks by 24 dp. Spacing follows an 8-point grid (4, 8, 12, 16, 24, 32, 40), with 4 for fine adjustments. Tab screens pad their bottom by the 80 dp navigation height plus the system inset so the last item clears the bar.

The home order is fixed: header row (greeting and name at start, 48 dp bell at end), the card full width at 85.6 : 54, the full-width 56 dp light renew button, then the order track. The card's own interior is 24 dp inline and 16 dp block padding, laid out top/middle/bottom with space-between.

Layout is direction-safe: rows follow the app direction, start/end offsets are used for absolute positions, and back arrows point forward-in-RTL (`arrow-forward`).

## Elevation & Depth

The main tabs are flat. Depth is conveyed by tonal steps (canvas, surface, surface 2, surface 3) and 1 dp hairline borders in Line or Line Strong. The only light effect is the card's sheen: a 240 dp translucent white disc (6%) clipped into the card's top end corner. Shadow tokens (`shadow.card/float/glow/glowSoft`) remain in `theme.ts` for the old screens but are not used by the main tabs.

### Named Rules
**The Flat Night Rule.** No drop shadows or glows on the main tabs. If something must sit above, give it the next tonal surface and a hairline.

## Shapes

Gently rounded throughout. Cards, the subscription card and settings panels use 20 dp corners; buttons and banners 16 dp; the card's date band 6 dp; the plan chip, seal, bell and badges are full pills or circles. The nav indicator is a 64 × 32 dp pill. Borders are 1 dp; the empty card's border is dashed, marking the place where a card will appear. The sign-in scene shows the corner of a card (28 dp radius, rotated -12°) entering from the top end.

## Components

### Buttons
Firm, full-width, quiet except for the one that matters.
- **Shape:** gently rounded (16 dp), minimum 52 dp tall, 56 dp for the hero (`size="lg"`), 44 dp compact; 24 dp inline padding; optional Ionicons icon at 19 dp, 8 dp gap.
- **Light (hero):** Ice fill, night text. The one main action on a screen: «جدّد اشتراكك», sign in, register, download update.
- **Primary:** solid Shashtna Blue, white text: a screen's main action where the light button is not used (pay and upload proof, retry).
- **Secondary:** Surface 2 with a Line Strong hairline, ink text.
- **Ghost:** text only in Brand Ink.
- **Danger:** calm red at 12% fill with a 28% red hairline, red text.
- **Pressed / Disabled:** pressed drops to 88% opacity and scales to 0.98 with a selection haptic; disabled and loading sit at 50% opacity, loading shows a spinner in the label colour.

### Cards / Containers
- **Corner Style:** 20 dp.
- **Background:** Surface, one tonal step above the canvas.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1 dp Line; a highlighted card swaps the border to Shashtna Blue.
- **Internal Padding:** 16 dp. Pressable cards use an 8% ink ripple and scale to 0.99.

### The Shashtna Card (signature)
The subscription as a prepaid card: true 85.6 : 54 proportions, Shashtna Blue face, 20 dp corners, the 6% sheen disc. Top row: «شاشتنا» in heading weight and the plan name in a hairline pill (45% white border). Middle: the days-left Display numeral with «يوم باقي» / «أيام باقية» in Card Face Ink. Bottom row: the Scratch Silver band with the end date in night text, and the 36 dp gold seal. Expiring turns the band amber and prefixes «قرب ينتهي»; ended turns the face Surface 3, shows «انتهى» at Hero size and dims the seal to Ended Slate. The numeral counts up once (700 ms, ease-out cubic) only when the days grew since last shown, and is instant under reduced motion. Before the first subscription an **empty card** keeps the same proportions as a Surface panel with a dashed Line Strong border, the seal, and one sentence on what to do.

### Order Track
«طلبك الحالي»: a heading with the price at end, a caption with service and order type, then three stations (استلمنا الحوالة، نتحقق منها، نفعّل) on a 3 dp rail. Done stations and rail are Shashtna Blue, upcoming are Line Strong, the current one sits in a 25% blue halo. Under it, one honest wait line in body text (with support hours while waiting), then one action: primary «ادفع وارفع صورة الحوالة» when payment is due, otherwise a compact ghost «تفاصيل الطلب». It is announced to screen readers as one progress bar.

### Lists and Settings Groups
A settings group is a Surface panel (20 dp, 1 dp border, 16 dp inline padding) with an optional caption title in Ink 3 above and an optional caption footer below; rows are separated by 1 dp Line dividers inset 52 dp from the start. A list row is at least 56 dp tall: a 40 dp tinted icon well (tone at 14% fill, 22% border), label title, optional caption subtitle in Ink 3, optional unread dot, and a direction-aware chevron.

### Navigation
Material 3 bottom bar: 80 dp plus the system inset, flush to the edge, Nav Night with a hairline top border. Three destinations in order (first at the right edge in Arabic): «اشتراكي»، «المتجر»، «مساعدة». The active destination gets the filled icon on a 64 × 32 dp translucent-blue pill and a bold Ink caption; inactive ones use outline icons and Ink 3. A count badge is a Shashtna Blue pill. In-app website pages show a 48 dp back / title / reload bar on the canvas with a hairline under it (the store tab hides it).

### Update Banner and Gate
When a newer APK exists, a dismissible Surface 3 banner (16 dp, Line Strong border) floats under the status bar. Below the minimum version, a full-screen gate on the canvas shows a 48 dp Brand Ink icon, a title, a body line and the light «تنزيل التحديث» button.

## Do's and Don'ts

### Do:
- **Do** keep the canvas flat Night Canvas on every screen and in-app web page.
- **Do** show the subscription as the Shashtna Card at 85.6 : 54, with the days as a Display numeral and the end date on the silver band.
- **Do** use exactly one light (Ice) button per screen, for its main action, at 56 dp when it is the hero.
- **Do** tell subscription state with the one ramp: blue running, amber band expiring, Surface 3 and slate ended.
- **Do** separate surfaces with tonal steps and 1 dp hairlines, on the 8-point grid with a 24 dp page margin.
- **Do** keep tap targets at 48 dp or more (44 dp minimum for compact buttons) and let text scale with the system up to 1.4x.

### Don't:
- **Don't** use Seal Gold anywhere but the card's seal.
- **Don't** add drop shadows, glows, gradients or ambient light to the main tabs; the old Liquid Glass components (`FloatingTabBar`, `GradientSurface`, spotlight) are retired, not a pattern to reuse.
- **Don't** put the days left in a progress bar or a boxed tile.
- **Don't** bundle a display face; use the system Arabic font.
- **Don't** put a second Ice button on the same screen.
