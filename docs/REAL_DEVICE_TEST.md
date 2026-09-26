# Real Android build + real push — runbook

Automated tests (unit, integration, acceptance with a recorded push
provider) are already green. What remains **must be done on a physical
Android phone** with a real build — not Expo Go. This file is the exact
procedure and a results sheet to fill in.

## 0. One-time setup (≈20 min)

1. **Expo project** — on your PC in `D:\IPTV-mobile`:
   ```bash
   npm install
   npx eas-cli login
   npx eas-cli init            # prints the project id
   ```
   Put the id in EAS as an environment variable `EAS_PROJECT_ID`
   (expo.dev → project → Environment variables), or in `app.json →
   extra.eas.projectId`.
2. **Firebase (FCM) for Android push**
   - console.firebase.google.com → add project → add Android app with
     package **`app.shashtna.mobile`** → download `google-services.json`.
   - Upload it to EAS as a *file* environment variable named
     `GOOGLE_SERVICES_JSON` (never commit it; it is git-ignored).
   - Project settings → Service accounts → generate a private key, then
     `npx eas-cli credentials` → Android → *FCM V1 service account key* →
     upload it.
3. **Website** — deploy branch `feat/modern-shashtna-mobile` to a Netlify
   preview (or production when ready):
   - apply the two additive migrations (`npx prisma db migrate --db …`, back
     up first);
   - set `CRON_SECRET` (random, ≥24 chars); `EXPO_ACCESS_TOKEN` only if you
     enabled "enhanced push security" on expo.dev;
   - do **not** set `EXPO_PUSH_API_URL` (test-only).
   - To point a test build at a preview deploy, build with
     `EXPO_PUBLIC_API_URL=https://<preview>.netlify.app`.

## 1. Build and install

```bash
npx eas-cli build --profile preview --platform android    # installable APK
```
Download the APK from the build page on the phone and install it (allow
"install unknown apps"). This is a standalone app: it does not need Expo Go.

For the release: `npx eas-cli build --profile production --platform android`
(AAB for Play Store).

## 2. App checklist (record ✅/❌ and a note)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Install | Icon «شاشتنا», dark splash | |
| 2 | Launch | Login screen, RTL | |
| 3 | Login (website account) | Dashboard; notification permission prompt once | |
| 4 | Dashboard | Hero, quick actions, offers/news from the website | |
| 5 | Packages | Same packages/prices as the website | |
| 6 | Select package | Package details | |
| 7 | Checkout | Customer info, package, contact method, note, total | |
| 8 | Confirm order | Order created | |
| 9 | Dashboard redirect | «تم إنشاء طلبك ✅» + «طلب قيد المتابعة» | |
| 10 | Payment | Amount, transfer number (copy works), recipient | |
| 11 | Proof upload | Gallery/camera, reference, «قيد مراجعة الدفع» | |
| 12 | Review state | Admin order shows the proof; order still unpaid | |
| 13 | Subscription | After admin activation: details, credentials hidden until «إظهار» | |
| 14 | Support | New ticket; admin sees app diagnostics; reply arrives | |
| 15 | Announcements | Admin creates/edits/ends → app follows | |
| 16 | Offers | Same | |
| 17 | Notification centre | List, unread, mark read / all | |
| 18 | Push | See section 3 | |
| 19 | Notification tap | Opens the right screen | |
| 20 | Deep link | `adb shell am start -a android.intent.action.VIEW -d "shashtna://orders"` opens orders | |
| 21 | Logout | Back to login; admin customer page shows the phone as inactive | |
| 22 | Re-login | Phone active again | |

## 3. Real push test (mandatory before release)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Install the build, log in as a test customer | | |
| 2 | Allow notifications | | |
| 3 | حسابي → فحص الإشعارات | All four checks ✅ | |
| 4 | Admin → العملاء → the customer | Phone listed under «هواتف التطبيق», active | |
| 5 | Admin → إشعارات الهواتف → إشعار جديد | | |
| 6 | Audience «عميل محدد» + the phone number, destination e.g. «طلب محدد» | | |
| 7 | إرسال الآن | «تم الإرسال إلى 1 حساب — 1 من 1 جهاز» | |
| 8 | App **open** | Banner shows while in the app | |
| 9 | App **in background** | Notification in the tray | |
| 10 | App **swiped away** (terminated) | Notification in the tray | |
| 11 | Tap each | Opens the chosen screen (cold start included) | |
| 12 | Notification centre | Item present; marked read after tap | |
| 13 | Two phones, same account | Both receive one send | |
| 14 | Admin marks an order «تم الدفع» | Automatic «تحديث الطلب» push arrives | |
| 15 | History | Admin history shows delivery counts; after ~15 min receipts are checked by the scheduler | |

If a push does not arrive: check «فحص الإشعارات», then the campaign's error
column in admin history, then that the FCM key is uploaded to EAS.
