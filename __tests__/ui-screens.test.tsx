import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, waitFor, within } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import type { AppNotification } from '@/src/api/types';
import { SPOTLIGHT_KEY } from '@/src/features/spotlight/session';
import { ONBOARDING_KEY } from '@/src/onboarding/OnboardingProvider';

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

describe('onboarding', () => {
  it('shows once on first launch, then goes to the guest home (not login)', async () => {
    const { screen } = await startApp({ onboarded: false });

    await screen.findByTestId('onboarding');
    screen.getByText('هلا بيك بشاشتنا');
    fireEvent.press(screen.getByTestId('onboarding-next'));
    await screen.findByText('اختار الباقة اللي تناسبك');
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    await screen.findByText('تحديثات أول بأول');
    fireEvent.press(screen.getByTestId('onboarding-start'));

    await screen.findByTestId('guest-welcome');
    expect(screen.queryByTestId('login-phone')).toBeNull();
    expect(await AsyncStorage.getItem(ONBOARDING_KEY)).toBeTruthy();
  });

  it('can be skipped, and is not shown again on the next launch', async () => {
    const first = await startApp({ onboarded: false });
    fireEvent.press(await first.screen.findByTestId('onboarding-skip'));
    await first.screen.findByTestId('guest-welcome');
    first.screen.unmount();

    // Next launch: same storage, straight to the guest home.
    const { screen } = await startApp({ onboarded: false });
    await screen.findByTestId('guest-welcome');
    expect(screen.queryByTestId('onboarding')).toBeNull();
  });
});

describe('guest home', () => {
  it('browses real catalogue content without an account', async () => {
    const { screen, backend } = await startApp();

    await screen.findByTestId('guest-welcome');
    // Spotlight features a real package from the catalogue.
    const spotlight = await screen.findByTestId('promo-spotlight');
    within(spotlight).getByText(PLAN.name);
    within(spotlight).getByText('25,000 د.ع');
    screen.getByTestId('quick-actions');

    // No account data is requested for a guest.
    expect(authedCalls(backend)).toEqual([]);

    fireEvent.press(within(spotlight).getByTestId('promo-cta'));
    await waitFor(() => expect(screen.getPathname()).toBe(`/packages/${PLAN.slug}`));
  });

  it('shows a 2–4 product campaign on some launches', async () => {
    await AsyncStorage.setItem(SPOTLIGHT_KEY, JSON.stringify({ recent: [], launches: 2 }));
    const { screen } = await startApp({
      backend: { catalog: { packages: [PLAN, VIP_PLAN, { ...PLAN, id: 9, slug: 'iptv-3', name: 'IPTV 3 أشهر' }], devices: [], currency: 'IQD' } },
    });

    const campaign = await screen.findByTestId('promo-campaign');
    within(campaign).getByText(PLAN.name);
    within(campaign).getByText(VIP_PLAN.name);
    expect(screen.queryByTestId('promo-spotlight')).toBeNull();
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

    await screen.findByTestId('subscription-hero');
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
    await screen.findByTestId('guest-welcome');
  });
});

describe('customer home', () => {
  it('active subscriber: subscription hero is the anchor, with a Member Spotlight (no sales ads)', async () => {
    const { screen } = await startApp({
      signedIn: true,
      backend: { dashboard: { accountState: 'ACTIVE', primarySubscription: makeSubscription(), nextAction: null } },
    });

    const hero = await screen.findByTestId('subscription-hero');
    within(hero).getByText('IPTV شهر');
    within(hero).getByText('20');
    within(hero).getByText('اشتراكك شغّال');
    within(hero).getByTestId('hero-renew');
    await screen.findByTestId('member-spotlight');
    expect(screen.queryByTestId('promo-spotlight')).toBeNull();
    expect(screen.queryByTestId('promo-campaign')).toBeNull();
  });

  it('expired subscriber: renewal first and a promotional spotlight', async () => {
    const { screen } = await startApp({
      signedIn: true,
      backend: { dashboard: { accountState: 'EXPIRED', primarySubscription: makeSubscription({ state: 'EXPIRED', daysRemaining: 0 }), nextAction: null } },
    });

    const hero = await screen.findByTestId('subscription-hero');
    within(hero).getByText('اشتراكك منتهي');
    within(hero).getByText('جدّد الآن');
    await screen.findByTestId('promo-spotlight');
    expect(screen.queryByTestId('member-spotlight')).toBeNull();
  });

  it('quick actions only open existing screens', async () => {
    const { screen } = await startApp({ signedIn: true });
    const actions = await screen.findByTestId('quick-actions');
    for (const key of ['packages', 'orders', 'notifications', 'support', 'status', 'account']) {
      within(actions).getByTestId(`quick-${key}`);
    }
    fireEvent.press(within(actions).getByTestId('quick-status'));
    await waitFor(() => expect(screen.getPathname()).toBe('/status'));
  });
});

describe('packages and product details', () => {
  it('filters by service type', async () => {
    const { screen } = await startApp({ backend: { catalog: { packages: [PLAN, VIP_PLAN], devices: [], currency: 'IQD' } } });

    fireEvent.press(await screen.findByTestId('tab-packages'));
    await screen.findByTestId(`package-${VIP_PLAN.slug}`);
    fireEvent.press(screen.getByTestId('package-filter-VIP'));
    await waitFor(() => expect(screen.queryByTestId(`package-${PLAN.slug}`)).toBeNull());
    screen.getByTestId(`package-${VIP_PLAN.slug}`);
  });

  it('shows the product with its facts, benefits, price and one primary action', async () => {
    const { screen } = await startApp({ url: `/packages/${PLAN.slug}` });

    await screen.findByText('شنو تحصل');
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
    const { screen } = await startApp();
    fireEvent.press(await screen.findByTestId('tab-orders'));
    await screen.findByTestId('guest-gate');
  });

  it('filters by the backend order states and shows each journey', async () => {
    const { screen } = await startApp({
      signedIn: true,
      backend: {
        order: makeOrder(),
        orders: [makeOrder({ id: 13, number: 'SH-000013', stage: 'ACTIVATED', status: 'COMPLETED', isOpen: false, needsPayment: false, canCancel: false })],
      },
    });

    fireEvent.press(await screen.findByTestId('tab-orders'));
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
      signedIn: true,
      backend: { notifications: [notification(2, { title: 'عرض جديد', type: 'OFFER' }), notification(1, { readAt: new Date().toISOString() })] },
    });

    fireEvent.press(await screen.findByTestId('tab-notifications'));
    const featured = await screen.findByTestId('notification-featured');
    within(featured).getByText('عرض جديد');
    screen.getByTestId('notification-1');

    fireEvent.press(screen.getByTestId('mark-all-read'));
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/notifications/read' && (call.body as { all?: boolean }).all)).toBe(true));
  });

  it('guests are asked to sign in', async () => {
    const { screen } = await startApp();
    fireEvent.press(await screen.findByTestId('tab-notifications'));
    await screen.findByTestId('guest-gate');
  });
});

describe('settings and account', () => {
  it('guest settings keep help and legal available', async () => {
    const { screen } = await startApp();
    fireEvent.press(await screen.findByTestId('tab-account'));
    await screen.findByTestId('guest-gate');
    screen.getByText('الدعم والمساعدة');
    screen.getByText('سياسة الخصوصية');
  });

  it('signing out returns to the guest home', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      void buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });
    const { screen } = await startApp({ signedIn: true });

    fireEvent.press(await screen.findByTestId('tab-account'));
    screen.getByText('الحساب والأمان');
    screen.getByText('تسجيل الخروج من كل الأجهزة');
    screen.getByText('فحص الإشعارات');
    fireEvent.press(screen.getByTestId('sign-out'));

    await screen.findByTestId('guest-welcome');
    expect(screen.getPathname()).toBe('/');
  });
});

describe('bottom navigation', () => {
  it('is a five-tab floating bar without the logo, with selection and unread badge', async () => {
    const { screen } = await startApp({ signedIn: true, backend: { notifications: [notification(1), notification(2)] } });

    const bar = await screen.findByTestId('floating-tab-bar');
    for (const label of ['الرئيسية', 'الباقات', 'طلباتي', 'حسابي']) within(bar).getByText(label);
    expect(within(bar).queryByLabelText('شعار شاشتنا')).toBeNull();
    await waitFor(() => within(bar).getByLabelText('الإشعارات، 2 جديد'));

    expect(screen.getByTestId('tab-index').props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId('tab-packages'));
    await waitFor(() => expect(screen.getByTestId('tab-packages').props.accessibilityState).toMatchObject({ selected: true }));
    expect(screen.getPathname()).toBe('/packages');
  });
});

describe('offline and errors', () => {
  it('the guest home explains a failed load in Arabic and retries', async () => {
    const { screen, backend } = await startApp();
    const normal = backend.fetchImpl.getMockImplementation()!;
    let failing = true;
    backend.fetchImpl.mockImplementation((url: string, init?: RequestInit) => (failing ? Promise.reject(new TypeError('Network request failed')) : normal(url, init)));

    await screen.findByText('ماكو اتصال', {}, { timeout: 15_000 });
    failing = false;
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await screen.findByTestId('promo-spotlight');
  });
});
