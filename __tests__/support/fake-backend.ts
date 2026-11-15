/**
 * In-memory stand-in for the Shashtna backend, answering the same routes and
 * shapes as /api/mobile/*. Used by the screen flow tests; the real backend is
 * covered by the website's integration tests and tests/backend here.
 */
import type { AppNotification, Catalog, Content, Dashboard, Order, OrderDetail, Package, ServiceStatus, Subscription } from '@/src/api/types';

const now = new Date().toISOString();

export const PLAN: Package = {
  id: 1,
  name: 'IPTV سنة',
  slug: 'iptv-year',
  serviceType: 'IPTV',
  price: 25000,
  durationMonths: 12,
  durationLabel: '1 Year',
  description: 'كل القنوات',
  features: ['4K', 'بدون تقطيع'],
  notes: null,
  imageUrl: null,
  isPopular: true,
  requiresDevice: false,
};

export function makeOrder(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 12,
    number: 'SH-000012',
    requestType: 'NEW',
    requestTypeLabel: 'اشتراك جديد',
    serviceType: 'IPTV',
    serviceName: PLAN.name,
    planSlug: PLAN.slug,
    price: 25000,
    durationMonths: 12,
    durationLabel: '1 Year',
    deviceName: null,
    devicePrice: null,
    paymentMethod: null,
    paymentReference: null,
    customerNote: null,
    status: 'SUBMITTED',
    statusLabel: 'تم الإرسال',
    statusHint: 'استلمنا طلبك.',
    stage: 'PAYMENT_PENDING',
    needsPayment: true,
    isOpen: true,
    canCancel: true,
    proofUploadedAt: null,
    subscriptionId: null,
    createdAt: now,
    updatedAt: now,
    journey: [
      { key: 'SELECT', label: 'اختيار الباقة', state: 'done' },
      { key: 'PAY', label: 'الدفع', state: 'current' },
      { key: 'PROOF', label: 'رفع إثبات الدفع', state: 'upcoming' },
      { key: 'REVIEW', label: 'مراجعة وتفعيل', state: 'upcoming' },
    ],
    payment: { transfer: { transferNumber: '9286253712', recipientName: 'Shashtna' }, instructions: null },
    events: [],
    ...overrides,
  };
}

export const VIP_PLAN: Package = {
  ...PLAN,
  id: 2,
  name: 'VIP ستة أشهر',
  slug: 'vip-6',
  serviceType: 'VIP',
  price: 40000,
  durationMonths: 6,
  durationLabel: '6 Months',
  isPopular: false,
  requiresDevice: true,
};

export function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 5,
    serviceType: 'IPTV',
    packageName: 'IPTV شهر',
    packageId: 3,
    packageSlug: 'iptv-month',
    status: 'ACTIVE',
    state: 'ACTIVE',
    stateLabel: 'نشط',
    daysRemaining: 20,
    remainingFraction: 0.66,
    startDate: now,
    expiryDate: new Date(Date.now() + 20 * 86_400_000).toISOString(),
    maxConnections: 1,
    createdAt: now,
    canRenew: true,
    credentials: null,
    ...overrides,
  };
}

export type BackendState = {
  loggedIn: boolean;
  order: OrderDetail | null;
  notifications: AppNotification[];
  calls: { method: string; path: string; body: unknown }[];
  catalog: Catalog;
  content: Content;
  status: ServiceStatus;
  /** Overrides merged into every dashboard response. */
  dashboard: Partial<Dashboard>;
  /** Extra orders listed on the orders screen (besides `order`). */
  orders: Order[];
  /** The customer's subscriptions («اشتراكي»). */
  subscriptions: Subscription[];
};

export function createBackend(initial: Partial<BackendState> = {}) {
  const state: BackendState = {
    loggedIn: false,
    order: null,
    notifications: [],
    calls: [],
    catalog: { packages: [PLAN], devices: [], currency: 'IQD' },
    content: { offers: [], announcements: [] },
    status: { overall: 'OPERATIONAL', active: [], resolved: [] },
    dashboard: {},
    orders: [],
    subscriptions: [],
    ...initial,
  };
  const user = { id: 7, name: 'علي حسن', phone: '07700000000', email: null, role: 'CUSTOMER', isStaff: false, preferredContact: null, renewalReminders: true, marketingOptIn: false, createdAt: now };

  function json(status: number, body: unknown) {
    return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
  }

  const fetchImpl = jest.fn((url: string, init: RequestInit = {}) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    state.calls.push({ method, path, body });
    const authed = Boolean((init.headers as Record<string, string> | undefined)?.Authorization);

    if (path === '/api/mobile/auth/login') {
      if (body.password !== 'secret123') return json(401, { success: false, code: 'INVALID_CREDENTIALS', message: 'رقم الهاتف أو كلمة المرور غير صحيحة.' });
      state.loggedIn = true;
      return json(200, { success: true, token: 'tkn', expiresAt: Date.now() + 86_400_000, user });
    }

    if (path === '/api/mobile/auth/register') {
      if (body.phone === '07711111111') return json(409, { success: false, code: 'PHONE_TAKEN', message: 'هذا الرقم مسجل مسبقًا.' });
      state.loggedIn = true;
      return json(201, { success: true, token: 'tkn', expiresAt: Date.now() + 86_400_000, user: { ...user, name: body.name, phone: body.phone } });
    }

    if (path === '/api/mobile/catalog') return json(200, { success: true, ...state.catalog });
    if (path === '/api/mobile/content') return json(200, { success: true, ...state.content });
    if (path === '/api/mobile/status') return json(200, { success: true, ...state.status });
    if (path === '/api/mobile/help') return json(200, { success: true, faq: [], troubleshooting: [], categories: [], support: {} });

    if (!authed) return json(401, { success: false, code: 'UNAUTHORIZED', message: 'انتهت الجلسة' });

    if (path === '/api/mobile/me') return json(200, { success: true, user });
    if (path.startsWith('/api/mobile/devices')) return json(200, { success: true, deviceId: 1 });

    if (path.startsWith('/api/mobile/checkout')) {
      const slug = new URL(`https://x${path}`).searchParams.get('plan');
      if (slug !== PLAN.slug) return json(404, { success: false, code: 'UNAVAILABLE', message: 'غير متاح' });
      return json(200, {
        success: true,
        mode: 'NEW',
        customer: { name: user.name, phone: user.phone },
        plan: { slug: PLAN.slug, name: PLAN.name, serviceType: 'IPTV', price: PLAN.price, durationLabel: PLAN.durationLabel, description: PLAN.description, features: PLAN.features, imageUrl: null },
        device: null,
        devices: [],
        initialDeviceId: null,
        subscription: null,
        contactOptions: ['TELEGRAM', 'PHONE'],
        initialContact: 'TELEGRAM',
      });
    }

    if (path.startsWith('/api/mobile/dashboard')) {
      const dashboard: Dashboard = {
        user,
        accountState: state.order ? 'PENDING' : 'NONE',
        primarySubscription: null,
        subscriptionsCount: 0,
        currentOrder: state.order,
        openOrdersCount: state.order ? 1 : 0,
        nextAction: state.order
          ? { kind: 'PAY_ORDER', title: 'كمّل الدفع', body: 'حوّل المبلغ وارفع الإثبات', orderId: state.order.id }
          : { kind: 'CHOOSE_PLAN', title: 'ابدأ اشتراكك', body: '' },
        unreadNotifications: state.notifications.filter((item) => !item.readAt).length,
        offers: [],
        announcements: [],
        incidents: [],
        hasPackages: true,
        recentActivity: [],
        generatedAt: now,
        ...state.dashboard,
      };
      return json(200, { success: true, ...dashboard });
    }

    if (path === '/api/mobile/orders' && method === 'POST') {
      state.order = makeOrder();
      return json(201, { success: true, order: state.order, alreadyExists: false });
    }

    if (path === '/api/mobile/orders') return json(200, { success: true, orders: [...(state.order ? [state.order] : []), ...state.orders] });

    if (path === '/api/mobile/subscriptions') return json(200, { success: true, subscriptions: state.subscriptions });

    const subscriptionMatch = path.match(/^\/api\/mobile\/subscriptions\/(\d+)$/);
    if (subscriptionMatch) {
      const subscription = state.subscriptions.find((item) => item.id === Number(subscriptionMatch[1]));
      return subscription
        ? json(200, { success: true, subscription, orders: [], receipts: [], events: [] })
        : json(404, { success: false, message: 'الاشتراك غير موجود.' });
    }

    const orderMatch = path.match(/^\/api\/mobile\/orders\/(\d+)$/);
    if (orderMatch) return state.order ? json(200, { success: true, order: state.order }) : json(404, { success: false, message: 'الطلب غير موجود.' });

    if (path.startsWith('/api/mobile/notifications/read')) {
      state.notifications = state.notifications.map((item) => (body.all || item.id === body.id ? { ...item, readAt: now } : item));
      return json(200, { success: true, unread: state.notifications.filter((item) => !item.readAt).length });
    }

    if (path.startsWith('/api/mobile/notifications')) {
      return json(200, { success: true, notifications: state.notifications, unread: state.notifications.filter((item) => !item.readAt).length, nextCursor: null });
    }

    return json(404, { success: false, message: `unhandled ${method} ${path}` });
  });

  return { state, fetchImpl };
}
