/**
 * Mandatory website ↔ mobile acceptance tests (announcement, offer, push).
 *
 * Needs, all local:
 *   SHASHTNA_API_URL     the website, e.g. http://127.0.0.1:3000
 *   ADMIN_PHONE / ADMIN_PASSWORD   an OWNER account on that website
 *   PUSH_RECORDER_PORT   port for the fake Expo Push API; start the website
 *                        with EXPO_PUSH_API_URL=http://127.0.0.1:<port>
 *
 * The admin steps click through the real admin console in Chromium; the
 * customer steps use the mobile app's own API client modules.
 */
import { createServer, type Server } from 'node:http';

import { chromium, type Browser, type Page } from 'playwright-core';

import { contentApi, dashboardApi } from '@/src/api/account';
import { authApi } from '@/src/api/auth';
import { configureApi } from '@/src/api/client';
import { devicesApi, notificationsApi } from '@/src/api/notifications';
import { checkoutApi, ordersApi, subscriptionsApi } from '@/src/api/orders';
import { destinationHref, pushHref } from '@/src/lib/destinations';

const BASE = (process.env.SHASHTNA_API_URL ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
const RUN = String(Date.now()).slice(-7);
const PUSH_TOKEN = `ExponentPushToken[acceptance${RUN}xyz]`;
const pushes: { to: string; title: string; body: string; data: { notificationId: number; link: string | null; type: string } }[] = [];

let token: string | null = null;
let customerPhone = '';
let browser: Browser;
let admin: Page;
let recorder: Server;

async function adminLogin(page: Page) {
  await page.goto(`${BASE}/login?redirect=/admin`);
  await page.fill('input[name="phone"]', process.env.ADMIN_PHONE!);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD!);
  await Promise.all([page.waitForURL((url) => url.pathname.startsWith('/admin')), page.click('button[type="submit"]')]);
}

async function saveAnnouncement(page: Page, fields: { id?: number; kind: 'AD' | 'ANNOUNCEMENT'; title: string; description: string; target?: string; active?: boolean; endsAt?: string }) {
  await page.goto(`${BASE}/admin/announcements${fields.id ? `?edit=${fields.id}` : ''}`);
  const form = page.locator('form').filter({ has: page.locator('input[name="title"]') });
  await form.locator('input[name="title"]').fill(fields.title);
  await form.locator('textarea[name="description"]').fill(fields.description);
  await form.locator('select[name="kind"]').selectOption(fields.kind);
  await form.locator('select[name="target"]').selectOption(fields.target ?? 'ALL');
  if (fields.endsAt !== undefined) await form.locator('input[name="endsAt"]').fill(fields.endsAt);
  const active = form.locator('input[name="isActive"]');
  if ((await active.isChecked()) !== (fields.active ?? true)) await active.click();
  await form.locator('button[type="submit"]').click();
  await page.getByText('تم حفظ الإعلان.').first().waitFor();
}

async function waitFor<T>(read: () => Promise<T>, ok: (value: T) => boolean, ms = 10_000) {
  const until = Date.now() + ms;
  let value = await read();
  while (!ok(value) && Date.now() < until) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    value = await read();
  }
  return value;
}

beforeAll(async () => {
  if (!process.env.ADMIN_PHONE || !process.env.ADMIN_PASSWORD || !process.env.PUSH_RECORDER_PORT) {
    throw new Error('Set SHASHTNA_API_URL, ADMIN_PHONE, ADMIN_PASSWORD and PUSH_RECORDER_PORT (see tests/backend/README.md).');
  }

  recorder = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : {};
      res.setHeader('Content-Type', 'application/json');

      if (req.url?.endsWith('/send')) {
        const messages = Array.isArray(body) ? body : [body];
        pushes.push(...messages);
        res.end(JSON.stringify({ data: messages.map((_, index) => ({ status: 'ok', id: `acc-${RUN}-${pushes.length}-${index}` })) }));
      } else {
        res.end(JSON.stringify({ data: {} }));
      }
    });
  });
  await new Promise<void>((resolve) => recorder.listen(Number(process.env.PUSH_RECORDER_PORT), '127.0.0.1', resolve));

  configureApi({ baseUrl: BASE, getToken: () => token, onUnauthorized: () => undefined, fetchImpl: (...args) => fetch(...args) });

  customerPhone = `0780${RUN}`;
  const session = await authApi.register({ name: 'عميل تجربة', phone: customerPhone, password: 'secret123', terms: true });
  token = session.token;
  await authApi.updateMe({ marketingOptIn: true });
  await devicesApi.register({ token: PUSH_TOKEN, platform: 'ANDROID', deviceName: 'Acceptance Phone', appVersion: 'acceptance' });

  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
  admin = await browser.newPage();
  await adminLogin(admin);
});

afterAll(async () => {
  await browser?.close();
  await new Promise((resolve) => recorder?.close(resolve));
});

test('TEST A — announcement: create → website → mobile → edit → expire → remove', async () => {
  const title = `إعلان تجريبي ${RUN}`;
  await saveAnnouncement(admin, { kind: 'ANNOUNCEMENT', title, description: 'صيانة ليلة الجمعة' });

  // Mobile API returns it (and the dashboard shows it).
  const listed = await waitFor(() => contentApi.list(), (content) => content.announcements.some((item) => item.title === title));
  const item = listed.announcements.find((entry) => entry.title === title)!;
  expect(item.description).toBe('صيانة ليلة الجمعة');
  const dashboard = await dashboardApi.get();
  expect(dashboard.announcements.some((entry) => entry.id === item.id)).toBe(true);

  // Website displays the same record.
  const page = await browser.newPage();
  await page.goto(`${BASE}/announcements/${item.id}`);
  await expect(page.getByRole('heading', { name: title }).isVisible()).resolves.toBe(true);

  // Admin edits → mobile gets the updated record.
  const edited = `${title} (محدث)`;
  await saveAnnouncement(admin, { id: item.id, kind: 'ANNOUNCEMENT', title: edited, description: 'تم تأجيل الصيانة' });
  const detail = await contentApi.get(item.id);
  expect(detail.item.title).toBe(edited);
  expect(detail.item.description).toBe('تم تأجيل الصيانة');
  await page.reload();
  await expect(page.getByRole('heading', { name: edited }).isVisible()).resolves.toBe(true);

  // Admin expires it → gone on both.
  await saveAnnouncement(admin, { id: item.id, kind: 'ANNOUNCEMENT', title: edited, description: 'تم تأجيل الصيانة', endsAt: '2020-01-01T00:00' });
  await expect(contentApi.get(item.id)).rejects.toMatchObject({ kind: 'not_found' });
  expect((await contentApi.list()).announcements.some((entry) => entry.id === item.id)).toBe(false);
  const gone = await page.goto(`${BASE}/announcements/${item.id}`);
  expect(gone?.status()).toBe(404);

  // Admin removes it.
  await admin.goto(`${BASE}/admin/announcements`);
  const row = admin.locator('li').filter({ hasText: edited });
  await row.locator('button[type="submit"]').click();
  await row.waitFor({ state: 'detached' });
  await expect(contentApi.get(item.id)).rejects.toMatchObject({ kind: 'not_found' });
  await page.close();
});

test('TEST B — offer: create → website + mobile → update', async () => {
  const title = `عرض تجريبي ${RUN}`;
  await saveAnnouncement(admin, { kind: 'AD', title, description: 'خصم 20٪' });

  const listed = await waitFor(() => contentApi.list(), (content) => content.offers.some((item) => item.title === title));
  const offer = listed.offers.find((item) => item.title === title)!;
  expect(offer.kind).toBe('OFFER');

  const page = await browser.newPage();
  await page.goto(`${BASE}/announcements/${offer.id}`);
  await expect(page.getByRole('heading', { name: title }).isVisible()).resolves.toBe(true);

  await saveAnnouncement(admin, { id: offer.id, kind: 'AD', title, description: 'خصم 30٪ لفترة محدودة' });
  expect((await contentApi.get(offer.id)).item.description).toBe('خصم 30٪ لفترة محدودة');
  await page.reload();
  await expect(page.getByText('خصم 30٪ لفترة محدودة').isVisible()).resolves.toBe(true);

  // Mobile-only targeting keeps it off the website.
  await saveAnnouncement(admin, { id: offer.id, kind: 'AD', title, description: 'خصم 30٪ لفترة محدودة', target: 'MOBILE' });
  expect((await contentApi.get(offer.id)).item.title).toBe(title);
  expect((await page.goto(`${BASE}/announcements/${offer.id}`))?.status()).toBe(404);
  await page.close();
});

test('TEST E — push (recorded provider): admin sends to a customer → device resolved → push → notification centre → destination', async () => {
  // A real order for this customer so the push can point at it.
  const catalog = await (await fetch(`${BASE}/api/mobile/catalog`)).json();
  const plan = catalog.packages[0];
  expect(plan).toBeDefined();
  const { order } = await ordersApi.create({ requestType: 'NEW', planSlug: plan.slug, contactMethod: 'PHONE' });

  const before = pushes.length;
  await admin.goto(`${BASE}/admin/notifications`);
  await admin.fill('input[name="title"]', `طلبك جاهز للدفع ${RUN}`);
  await admin.fill('textarea[name="body"]', 'حوّل المبلغ وارفع الإثبات من التطبيق');
  await admin.selectOption('select[name="type"]', 'PAYMENT_UPDATE');
  await admin.selectOption('select[name="audience"]', 'CUSTOMER');
  await admin.fill('input[name="phone"]', customerPhone);
  await admin.selectOption('select[name="destinationKind"]', 'ORDER');
  await admin.fill('input[name="destinationParam"]', String(order.id));
  await admin.getByRole('button', { name: 'إرسال الآن' }).first().click();
  await admin.getByText(/تم الإرسال إلى 1 حساب/).first().waitFor();

  // Backend resolved our device and the push provider received it.
  const sent = pushes.slice(before).find((message) => message.to === PUSH_TOKEN);
  expect(sent).toBeDefined();
  expect(sent!.title).toBe(`طلبك جاهز للدفع ${RUN}`);
  expect(sent!.data.link).toBe(`/orders/${order.id}`);

  // Tapping opens the order screen.
  expect(pushHref(sent!.data)).toBe(`/orders/${order.id}`);

  // It is in the notification centre, unread, with a typed destination.
  const page = await notificationsApi.list();
  const item = page.notifications.find((entry) => entry.id === sent!.data.notificationId)!;
  expect(item).toBeDefined();
  expect(item.readAt).toBeNull();
  expect(item.destination).toEqual({ kind: 'ORDER', id: order.id });
  expect(destinationHref(item.destination!)).toBe(`/orders/${order.id}`);

  const read = await notificationsApi.markRead(item.id);
  expect(read.unread).toBe(page.unread - 1);

  // History in the admin console shows the delivery.
  await admin.goto(`${BASE}/admin/notifications`);
  await expect(admin.getByText(`طلبك جاهز للدفع ${RUN}`).first().isVisible()).resolves.toBe(true);
});

test('automatic business events are pushed too (staff marks an order paid in the admin console)', async () => {
  const catalog = await (await fetch(`${BASE}/api/mobile/catalog`)).json();
  const { order } = await ordersApi.create({ requestType: 'RENEW', planSlug: catalog.packages[0].slug, contactMethod: 'PHONE' });
  const before = pushes.length;

  await admin.goto(`${BASE}/admin/orders/${order.id}`);
  await admin.selectOption('select[name="status"]', 'PAID');
  await admin.locator('form').filter({ has: admin.locator('select[name="status"]') }).locator('button[type="submit"]').first().click();
  await admin.getByText('تم تحديث الطلب.').first().waitFor();

  const sent = await waitFor(async () => pushes.slice(before).find((message) => message.to === PUSH_TOKEN), Boolean);
  expect(sent?.data.type).toBe('ORDER_STATUS');
  expect(pushHref(sent!.data)).toBe(`/orders/${order.id}`);
  expect((await ordersApi.get(order.id)).order.stage).toBe('PAID');
});

test('TEST C — order update: customer creates → mobile shows → admin changes state → mobile reflects', async () => {
  const catalog = await (await fetch(`${BASE}/api/mobile/catalog`)).json();
  const { order } = await ordersApi.create({ requestType: 'NEW', planSlug: catalog.packages[1]?.slug ?? catalog.packages[0].slug, contactMethod: 'PHONE' });

  expect((await ordersApi.list()).orders.some((item) => item.id === order.id)).toBe(true);
  expect((await ordersApi.get(order.id)).order.status).toBe('SUBMITTED');

  await admin.goto(`${BASE}/admin/orders/${order.id}`);
  await admin.selectOption('select[name="status"]', 'AWAITING_PAYMENT');
  await admin.locator('form').filter({ has: admin.locator('select[name="status"]') }).locator('button[type="submit"]').first().click();
  await admin.getByText('تم تحديث الطلب.').first().waitFor();

  const updated = (await ordersApi.get(order.id)).order;
  expect(updated.status).toBe('AWAITING_PAYMENT');
  expect(updated.stage).toBe('PAYMENT_PENDING');
});

test('TEST D — payment: confirm → dashboard payment → proof → admin sees proof → unpaid until verified → paid → activated', async () => {
  const catalog = await (await fetch(`${BASE}/api/mobile/catalog`)).json();
  const plan = catalog.packages.find((item: { serviceType: string }) => item.serviceType === 'IPTV');
  expect(plan).toBeDefined();

  // Confirmation resolved by the shared checkout service, then the order.
  const confirmation = await checkoutApi.get({ plan: plan.slug });
  expect(confirmation.plan?.slug).toBe(plan.slug);
  const { order } = await ordersApi.create({ requestType: 'NEW', planSlug: plan.slug, contactMethod: confirmation.initialContact });

  // Dashboard highlights it with the payment details.
  const dashboard = await dashboardApi.get(order.id);
  expect(dashboard.currentOrder?.id).toBe(order.id);
  expect(dashboard.currentOrder?.stage).toBe('PAYMENT_PENDING');
  expect(dashboard.currentOrder?.payment.transfer?.transferNumber).toBeTruthy();

  // Proof upload through the same endpoint the app uses (multipart).
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const form = new FormData();
  form.append('paymentProof', new File([png], 'proof.png', { type: 'image/png' }));
  form.append('paymentReference', `REF-${RUN}`);
  const uploadResponse = await fetch(`${BASE}/api/mobile/orders/${order.id}/proof`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  expect(uploadResponse.status).toBe(200);

  let detail = (await ordersApi.get(order.id)).order;
  expect(detail.stage).toBe('UNDER_REVIEW');
  expect(detail.status).toBe('SUBMITTED'); // still unpaid
  expect(detail.paymentReference).toBe(`REF-${RUN}`);

  // Stored privately: no public URL, another customer can't read it.
  expect((await fetch(`${BASE}/api/mobile/orders/${order.id}/proof`)).status).toBe(401);

  // Admin sees the proof on the order page.
  await admin.goto(`${BASE}/admin/orders/${order.id}`);
  await admin.getByText('مرفوع').first().waitFor();
  // The proof image, served only to the owner and order staff, loads in the admin page.
  // (A string so Babel doesn't rewrite the function that runs in the browser.)
  const proof = await admin.evaluate(
    `fetch('/api/orders/${order.id}/payment-proof', { credentials: 'include' }).then((r) => ({ status: r.status, type: r.headers.get('content-type') }))`,
  );
  expect(proof).toEqual({ status: 200, type: 'image/png' });

  // Admin verifies → paid.
  await admin.selectOption('select[name="status"]', 'PAID');
  await admin.locator('form').filter({ has: admin.locator('select[name="status"]') }).locator('button[type="submit"]').first().click();
  await admin.getByText('تم تحديث الطلب.').first().waitFor();
  detail = (await ordersApi.get(order.id)).order;
  expect(detail.stage).toBe('PAID');

  // Admin activates the subscription from the order.
  await admin.goto(`${BASE}/admin/subscription-requests/${order.id}/add`);
  await admin.getByPlaceholder('مثال: STAR001').fill(`acc${RUN}`);
  await admin.getByPlaceholder('كلمة مرور الاشتراك').fill('pass1234');
  await admin.locator('button[type="submit"]').last().click();
  const activated = await waitFor(() => ordersApi.get(order.id).then((result) => result.order), (value) => value.stage === 'ACTIVATED', 15_000);
  expect(activated.stage).toBe('ACTIVATED');
  expect(activated.subscriptionId).toBeTruthy();

  const subs = await subscriptionsApi.get(activated.subscriptionId!);
  expect(subs.subscription.credentials?.username).toBe(`acc${RUN}`);
  expect(pushes.some((message) => message.to === PUSH_TOKEN && message.data.type === 'SUBSCRIPTION_ACTIVATED')).toBe(true);
});
