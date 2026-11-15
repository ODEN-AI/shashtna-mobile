import { fireEvent, waitFor, within } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import type { AppNotification } from '@/src/api/types';

import { authedCalls, resetDevice, startApp } from './support/app';
import { makeOrder, makeSubscription, PLAN, VIP_PLAN } from './support/fake-backend';

jest.mock('@/src/lib/config', () => ({ API_BASE_URL: 'https://api.test', APP_VERSION: '2.0.0', EAS_PROJECT_ID: 'test-project' }));

jest.setTimeout(30_000);

beforeEach(resetDevice);
afterEach(() => jest.restoreAllMocks());

const notification = (id: number, extra: Partial<AppNotification> = {}): AppNotification => ({
  id,
  type: 'ANNOUNCEMENT',
  title: `إشعار ${id}`,
  body: 'نص الإشعار',
  imageUrl: null,
  destination: null,
  readAt: null,
  createdAt: new Date().toISOString(),
  ...extra,
});

describe('guest home', () => {
  it('shows what Shashtna is and real packages, without asking for account data', async () => {
    const { screen, backend } = await startApp();

    await screen.findByTestId('guest-welcome');
    screen.getByText('ليش تختار شاشتنا؟');
    await screen.findByTestId(`guest-package-${PLAN.slug}`);
    screen.getByText('25,000');
    expect(authedCalls(backend)).toEqual([]);

    fireEvent.press(screen.getByTestId('guest-store'));
    await waitFor(() => expect(screen.getPathname()).toBe('/packages'));
  });

  it('first launch shows the four onboarding steps, then the guest home', async () => {
    const { screen } = await startApp({ onboarded: false });

    await screen.findByTestId('onboarding');
    screen.getByText('الخطوة 1 من 4');
    fireEvent.press(screen.getByTestId('onboarding-next'));
    await screen.findByText('اختار باقتك بسهولة');
    fireEvent.press(screen.getByTestId('onboarding-skip'));
    await screen.findByTestId('guest-welcome');
  });
});

describe('login and register', () => {
  it('creates an account in the app and lands on the customer home', async () => {
    const { screen, backend } = await startApp();

    fireEvent.press(await screen.findByTestId('guest-register'));
    await screen.findByTestId('register-name');
    fireEvent.changeText(screen.getByTestId('register-name'), 'سارة');
    fireEvent.changeText(screen.getByTestId('register-phone'), '07722222222');
    fireEvent.changeText(screen.getByTestId('register-password'), 'secret123');
    fireEvent.changeText(screen.getByTestId('register-confirm'), 'other');
    fireEvent.press(screen.getByTestId('register-submit'));
    await screen.findByText('كلمتا المرور غير متطابقتين.');

    fireEvent.changeText(screen.getByTestId('register-confirm'), 'secret123');
    fireEvent.press(screen.getByTestId('register-submit'));
    await screen.findByText('لازم توافق على الشروط والأحكام.');

    fireEvent.press(screen.getByTestId('register-terms'));
    fireEvent.press(screen.getByTestId('register-submit'));

    await screen.findByTestId('home-renew');
    const call = backend.state.calls.find((item) => item.path === '/api/mobile/auth/register');
    expect(call?.body).toEqual({ name: 'سارة', phone: '07722222222', password: 'secret123', terms: true });
  });

  it('switches between login and register, and closing returns to browsing as a guest', async () => {
    const { screen } = await startApp();

    fireEvent.press(await screen.findByTestId('guest-login'));
    await screen.findByTestId('login-phone');
    fireEvent.press(screen.getByTestId('go-register'));
    await screen.findByTestId('register-name');
    fireEvent.press(screen.getByTestId('auth-close'));
    await screen.findByTestId('guest-store');
  });
});

describe('customer home', () => {
  it('active subscriber: the dial shows days left and the end date, with renew and details', async () => {
    const { screen } = await startApp({
      signedIn: true,
      backend: { dashboard: { accountState: 'ACTIVE', primarySubscription: makeSubscription(), nextAction: null } },
    });

    await screen.findByText('يا هلا بيك، علي 👋');
    const card = await screen.findByTestId('subscription-card');
    within(card).getByText('20');
    within(card).getByText('اشتراكك شغّال');
    within(card).getByText(/^ينتهي في /);
    within(card).getByText('جدّد اشتراكك هسه');
    expect(screen.queryByTestId('order-track')).toBeNull();
    screen.getByTestId('quick-services');
  });

  it('renewing opens that package in renewal mode with its renewal price', async () => {
    const { screen } = await startApp({
      signedIn: true,
      backend: { dashboard: { accountState: 'ACTIVE', primarySubscription: makeSubscription({ packageSlug: PLAN.slug }), nextAction: null } },
    });

    fireEvent.press(await screen.findByTestId('home-renew'));
    await waitFor(() => expect(screen.getPathname()).toBe(`/packages/${PLAN.slug}`));
    await screen.findByText('متابعة التجديد والدفع');
    screen.getByText('تجديد');
  });

  it('expiring and ended subscriptions say so plainly', async () => {
    const soon = await startApp({
      signedIn: true,
      backend: { dashboard: { accountState: 'EXPIRING', primarySubscription: makeSubscription({ state: 'EXPIRING', daysRemaining: 3 }), nextAction: null } },
    });
    await soon.screen.findByText('تنبيه انتهاء الاشتراك');
    soon.screen.getByText('اشتراكك ينتهي قريباً');
    soon.screen.unmount();

    const { screen } = await startApp({
      signedIn: true,
      backend: { dashboard: { accountState: 'EXPIRED', primarySubscription: makeSubscription({ state: 'EXPIRED', daysRemaining: 0 }), nextAction: null } },
    });
    await screen.findByText('اشتراكك منتهي');
    screen.getByText('رجّع اشتراكك');
  });

  it('an order under review shows the manual check, and tracking opens the timeline', async () => {
    const { screen } = await startApp({
      signedIn: true,
      backend: { order: makeOrder({ stage: 'UNDER_REVIEW', status: 'PAID', needsPayment: false }) },
    });

    const mini = await screen.findByTestId('order-track');
    within(mini).getByText('فريقنا يدقق الحوالة يدوياً هسه');
    expect(screen.queryByTestId('order-pay')).toBeNull();

    fireEvent.press(within(mini).getByText('تابع طلبك'));
    await screen.findByTestId('order-timeline');
    screen.getByText('طلبك بين أيدي فريقنا هسه');
  });
});

describe('my subscription tab', () => {
  it('shows the subscription hub with days left, dates and the ways to watch and renew', async () => {
    const { screen } = await startApp({ signedIn: true, backend: { subscriptions: [makeSubscription()] } });

    fireEvent.press(await screen.findByTestId('tab-subscription'));
    const hub = await screen.findByTestId('subscription-card');
    within(hub).getByText('IPTV شهر');
    within(hub).getByText('باقي 20 يوم');
    screen.getByText('شاهد الآن عبر Shashtna Player');
    screen.getByTestId('subscription-credentials');
  });
});

describe('packages and product details', () => {
  it('filters by service type', async () => {
    const { screen } = await startApp({ url: '/packages', backend: { catalog: { packages: [PLAN, VIP_PLAN], devices: [], currency: 'IQD' } } });

    await screen.findByTestId(`package-${VIP_PLAN.slug}`);
    fireEvent.press(screen.getByTestId('package-filter-VIP'));
    await waitFor(() => expect(screen.queryByTestId(`package-${PLAN.slug}`)).toBeNull());
    screen.getByTestId(`package-${VIP_PLAN.slug}`);
  });

  it('shows the product with its facts, benefits, price and one primary action', async () => {
    const { screen } = await startApp({ url: `/packages/${PLAN.slug}` });

    await screen.findByText('محتويات ومميزات الباقة');
    screen.getByText('4K');
    screen.getByText('1 Year');
    expect(screen.getAllByText('25,000 د.ع').length).toBeGreaterThan(0);
    screen.getByTestId('order-package');
  });

  it('explains when a package is no longer available', async () => {
    const { screen } = await startApp({ url: '/packages/gone' });
    await screen.findByText('هذه الباقة غير متاحة حاليًا');
    expect(screen.queryByTestId('order-package')).toBeNull();
  });
});

describe('orders', () => {
  it('guests are asked to sign in', async () => {
    const { screen } = await startApp({ url: '/orders' });
    await screen.findByTestId('guest-gate');
  });

  it('filters by the backend order states and shows each journey', async () => {
    const { screen } = await startApp({
      url: '/orders',
      signedIn: true,
      backend: {
        order: makeOrder(),
        orders: [makeOrder({ id: 13, number: 'SH-000013', stage: 'ACTIVATED', status: 'COMPLETED', isOpen: false, needsPayment: false, canCancel: false })],
      },
    });

    await screen.findByTestId('order-12');
    screen.getByTestId('order-13');
    screen.getByText('ادفع الآن');

    fireEvent.press(screen.getByTestId('order-filter-DONE'));
    await waitFor(() => expect(screen.queryByTestId('order-12')).toBeNull());
    screen.getByTestId('order-13');
    expect(screen.getByLabelText('المرحلة 5 من 5: التفعيل')).toBeTruthy();
  });
});

describe('notifications', () => {
  it('features the newest unread item and marks everything read', async () => {
    const { screen, backend } = await startApp({
      url: '/notifications',
      signedIn: true,
      backend: { notifications: [notification(2, { title: 'عرض جديد', type: 'OFFER' }), notification(1, { readAt: new Date().toISOString() })] },
    });

    const featured = await screen.findByTestId('notification-featured');
    within(featured).getByText('عرض جديد');
    screen.getByTestId('notification-1');

    fireEvent.press(screen.getByTestId('mark-all-read'));
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/notifications/read' && (call.body as { all?: boolean }).all)).toBe(true));
  });

  it('guests are asked to sign in', async () => {
    const { screen } = await startApp({ url: '/notifications' });
    await screen.findByTestId('guest-gate');
  });
});

describe('settings and account', () => {
  it('guest settings keep help and legal available', async () => {
    const { screen } = await startApp({ url: '/account' });
    await screen.findByTestId('guest-gate');
    screen.getByText('الدعم والمساعدة');
    screen.getByText('سياسة الخصوصية');
  });

  it('signing out returns to the guest home', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      void buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });
    const { screen } = await startApp({ url: '/account', signedIn: true });

    await screen.findByText('الحساب والأمان');
    screen.getByText('تسجيل الخروج من كل الأجهزة');
    screen.getByText('فحص الإشعارات');
    fireEvent.press(screen.getByTestId('sign-out'));

    await screen.findByTestId('guest-store');
    expect(screen.getPathname()).toBe('/');
  });
});

describe('subscription details', () => {
  it('keeps the password masked until the customer reveals it', async () => {
    const subscription = makeSubscription({ credentials: { username: 'user77', password: 'pa55word', macAddress: null, deviceId: null } });
    const { screen } = await startApp({ url: `/subscriptions/${subscription.id}`, signedIn: true, backend: { subscriptions: [subscription] } });

    await screen.findByText('بيانات التشغيل');
    screen.getByText('user77');
    expect(screen.queryByText('pa55word')).toBeNull();

    fireEvent.press(screen.getByTestId('reveal-credentials'));
    await screen.findByText('pa55word');
  });
});

describe('payment', () => {
  it('shows the amount, the transfer number to copy and the receipt drop zone', async () => {
    const { screen } = await startApp({ url: '/orders/12', signedIn: true, backend: { order: makeOrder() } });

    const card = await screen.findByTestId('payment-card');
    within(card).getByText('9286253712');
    within(card).getByText('ارفع صورة وصل التحويل أو لقطة الشاشة');
    expect(within(card).getByTestId('upload-proof').props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe('offers and news', () => {
  const item = (id: number, kind: 'OFFER' | 'ANNOUNCEMENT', title: string) => ({
    id,
    kind,
    title,
    description: 'تفاصيل',
    imageUrl: null,
    style: 'default',
    placement: 'home',
    priority: 0,
    startsAt: null,
    endsAt: null,
    updatedAt: new Date().toISOString(),
    cta: null,
  });
  const content = {
    offers: [item(1, 'OFFER', 'خصم الصيف'), item(2, 'OFFER', 'عرض العائلة')],
    announcements: [item(3, 'ANNOUNCEMENT', 'سيرفر جديد'), item(4, 'ANNOUNCEMENT', 'تحديث المشغل')],
  };

  it('the home shows offers and announcements from the dashboard, and «شوف الكل» lists every one', async () => {
    const { screen } = await startApp({ signedIn: true, backend: { content } });

    const section = await screen.findByTestId('content-highlights');
    within(section).getByText('خصم الصيف');
    within(section).getByText('سيرفر جديد');

    fireEvent.press(within(section).getByText('شوف الكل'));
    const list = await screen.findByTestId('offers-list');
    for (const title of ['خصم الصيف', 'عرض العائلة', 'سيرفر جديد', 'تحديث المشغل']) within(list).getByText(title);
  });

  it('guests see them too', async () => {
    const { screen } = await startApp({ backend: { content } });
    const section = await screen.findByTestId('content-highlights');
    within(section).getByText('خصم الصيف');
  });
});

describe('bottom navigation', () => {
  it('has the five Stitch tabs with «اشتراكي» raised in the middle', async () => {
    const { screen } = await startApp({ signedIn: true });

    const bar = await screen.findByTestId('bottom-nav');
    for (const label of ['الرئيسية', 'الباقات', 'اشتراكي', 'الدعم', 'حسابي']) within(bar).getByText(label);

    expect(screen.getByTestId('tab-index').props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId('tab-support'));
    await waitFor(() => expect(screen.getByTestId('tab-support').props.accessibilityState).toMatchObject({ selected: true }));
    await screen.findByText('اسأل مساعد شاشتنا');
  });
});

describe('offline and errors', () => {
  it('the home explains a failed load in Arabic and retries', async () => {
    const { screen, backend } = await startApp({ signedIn: true, backend: { dashboard: { primarySubscription: makeSubscription() } } });
    const normal = backend.fetchImpl.getMockImplementation()!;
    let failing = true;
    backend.fetchImpl.mockImplementation((url: string, init?: RequestInit) => (failing ? Promise.reject(new TypeError('Network request failed')) : normal(url, init)));

    await screen.findByText('ماكو اتصال', {}, { timeout: 15_000 });
    failing = false;
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await screen.findByTestId('subscription-card');
  });
});
