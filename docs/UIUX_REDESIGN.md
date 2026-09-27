# Shashtna Mobile — UI/UX redesign ("Shashtna Liquid Glass")

Design-led rebuild of the app's interface on top of the unchanged backend
contract (auth, catalogue, checkout, manual payment + proof, push,
notifications, support). References: `Shashtna_UIUX_Reference_Pack` 01–14.

## Visual language

- **Canvas**: deep navy (`#020B26` → `#010619`) with two restrained light
  pools (`AmbientBackground`) — one static layer per screen, no animation.
- **Glass**: translucent navy fill + a lighter top rim (`GlassCard`,
  `SettingsGroup`, tab bar). No live blur: real-time blur is expensive on
  mid-range Android and unnecessary on a dark canvas.
- **Gradients** (`GradientSurface`, `src/ui/gradient.ts`): reserved for what
  deserves attention — the subscription hero, spotlight, primary buttons, the
  active tab, product visuals without an image. Drawn natively by React
  Native's `experimental_backgroundImage` (RN 0.86, new architecture), so no
  extra native dependency; isolated in one helper so it can be swapped.
- **Palette** (reference 02): `#03195B` navy · `#0B2CB1` royal · `#1951FC`
  electric · `#3781FC` sky (active accents) · `#CBE9FD` ice (highlights,
  light CTAs). Every gradient stop that carries text keeps white ≥ 5.7:1 and
  ice ≥ 4.5:1; body text on the canvas ≥ 6.7:1.
- **Typography**: system Arabic fonts (the website's Thmanyah Sans licence
  does not allow bundling). Scale: display 42 / hero 34 / title 26 /
  heading 17 / body 15 / label 13.5 / caption 12, `maxFontSizeMultiplier` 1.4.

## Tokens (`src/ui/theme.ts`)

`palette`, `colors` (canvas, surfaces, glass layers, borders, text, brand
roles, feedback), `gradients`, `radius`, `space`, `shadow` (`boxShadow`),
`motion` (durations + spring), `font`, `tabBar` geometry. Old token names are
kept (remapped) so every screen moved to the new system at once.

## Components

| Component | Role |
|---|---|
| `GlassCard` (`Card`) | standard surface, optional glow |
| `GradientSurface` | branded gradient with glass rim and light spots |
| `Button` / `PrimaryButton` / `GlassButton` | pill buttons: primary (gradient), light (ice), glass, ghost, danger |
| `IconTile` (`IconWell`) | rounded icon container, tinted or gradient-filled |
| `StatusBadge` (`Badge`) | tinted pill with live dot |
| `SectionHeader` / `Section` | title + eyebrow + "see all" |
| `FilterChips` | segmented filters with counts (packages, orders, notifications) |
| `ProgressDots` | onboarding / carousel position |
| `SettingsGroup` | grouped settings rows with dividers |
| `BrandMark` | the official emblem (never in the tab bar) |
| `SubscriptionHero` | home anchor: package, status, days, expiry, progress, renew |
| `PromoSpotlight` / `MemberSpotlight` | home spotlight (below) |
| `PackageCard` (ProductCard), `DeviceCard`, `ProductVisual` | products |
| `OrderCard` + `OrderProgress` | order facts + visual journey |
| `FeaturedNotification` / `NotificationCard` | notification centre |
| `FloatingTabBar` | floating glass capsule with gliding active pill |
| `AuthScene` | auth backdrop (luminous rings, soft geometry) + glass card |
| `GuestGate` | account-only content while browsing as a guest |

## Navigation and states

```
first launch ─▶ onboarding (4 steps, skippable, stored locally) ─▶ guest home
guest        ─▶ home · packages · package details · offers · status · help
             ─▶ "order" / account screens ─▶ login ─▶ continues to the screen asked for
signed in    ─▶ customer home (hero + member or promotional spotlight)
sign out     ─▶ guest home (or login with the reason, when the session was ended)
```

- `app/onboarding.tsx` guarded by `OnboardingProvider` (AsyncStorage flag).
- `(auth)` exists only while signed out; `(app)` is open to everyone.
- `(app)/(member)` holds account-only screens; its layout redirects a guest
  (or a signed-out deep link) to login and remembers the target
  (`src/auth/redirect.ts`).
- Tabs render guest variants: orders / notifications show `GuestGate`,
  «حسابي» becomes «الإعدادات» with help and legal links.

## Spotlight (`src/lib/spotlight.ts`, pure and unit-tested)

Built only from backend records: admin offers, catalogue packages and
devices, the customer's subscription, announcements and incidents.

| State | Spotlight |
|---|---|
| Guest / no subscription / expired | Promotional: one product per cold launch (least recently shown first, offers by admin priority, popular packages next); every third launch with ≥ 3 products becomes a 2–4 product campaign |
| Active / expiring | Member Spotlight: renewal reminder (≤ 7 days or expiring), subscriber offers, a real longer plan of the same service as upgrade, news, incidents; starts on a different slide each launch |
| Order in progress | none — the payment card has the focus |

The plan is made once per launch (`spotlight/session.ts`) and follows live
data afterwards (removed items disappear, prices update).

## Motion

Native-driver `Animated` only: tab pill spring, onboarding/spotlight
fade-and-rise, spotlight gradient "breathing", product float, skeleton pulse.
All looping motion stops under the OS reduced-motion setting and while the
screen is not focused.

## Logo

`assets/brand/logo.png` and all icons/splash are generated from reference
14: only the circular emblem is kept, everything outside the circle is
transparent. App icon: emblem on a navy gradient; adaptive icon: emblem in
the safe zone on navy; monochrome/notification icon: the emblem's strokes as
a white silhouette.
