import { act, fireEvent, waitFor } from 'expo-router/testing-library';

import { listeners, resetDevice, startApp } from './support/app';
import { makeOrder } from './support/fake-backend';

jest.mock('@/src/lib/config', () => ({ API_BASE_URL: 'https://api.test', APP_VERSION: '2.0.0', EAS_PROJECT_ID: 'test-project' }));

jest.setTimeout(30_000);

function tap(data: unknown) {
  act(() => {
    for (const listener of listeners.response) {
      listener({ actionIdentifier: 'default', notification: { request: { identifier: `id-${Math.random()}`, content: { data } } } });
    }
  });
}

beforeEach(resetDevice);

describe('customer journey (router + providers + API client)', () => {
  it('guest browses → orders a package → signs in → checkout → dashboard payment', async () => {
    const { screen, backend } = await startApp();

    // Guest home first — not the login screen.
    await screen.findByTestId('guest-welcome');
    expect(screen.queryByTestId('login-phone')).toBeNull();

    // Packages are open to guests.
    fireEvent.press(screen.getByTestId('tab-packages'));
    fireEvent.press(await screen.findByTestId('package-iptv-year'));
    fireEvent.press(await screen.findByTestId('order-package'));

    // Ordering needs an account: login, then straight on to checkout.
    await screen.findByTestId('login-phone');
    fireEvent.changeText(screen.getByTestId('login-phone'), '07700000000');
    fireEvent.changeText(screen.getByTestId('login-password'), 'wrong');
    fireEvent.press(screen.getByTestId('login-submit'));
    await screen.findByText('رقم الهاتف أو كلمة المرور غير صحيحة.');

    fireEvent.changeText(screen.getByTestId('login-password'), 'secret123');
    fireEvent.press(screen.getByTestId('login-submit'));

    // Checkout: same sections as the website, contact method chosen per order.
    await screen.findByText('بيانات العميل');
    expect(screen.getPathname()).toBe('/checkout');
    expect((await screen.findAllByText('طريقة التواصل')).length).toBe(2);

    // Push token registered for this account after login.
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/devices' && call.method === 'POST')).toBe(true));
    const device = backend.state.calls.find((call) => call.path === '/api/mobile/devices')!.body as Record<string, unknown>;
    expect(device).toMatchObject({ token: 'ExponentPushToken[testtesttesttest]', platform: expect.any(String) });

    fireEvent.press(screen.getByTestId('contact-PHONE'));
    fireEvent.press(screen.getByTestId('confirm-order'));

    // The order is created without any client price, with the chosen contact method.
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/orders' && call.method === 'POST')).toBe(true));
    const created = backend.state.calls.find((call) => call.path === '/api/mobile/orders' && call.method === 'POST')!.body as Record<string, unknown>;
    expect(created).toEqual({ requestType: 'NEW', planSlug: 'iptv-year', contactMethod: 'PHONE' });

    // Then the dashboard, highlighting the new order with its payment step.
    await screen.findByText('تم إنشاء طلبك ✅ الخطوة التالية: إتمام الدفع');
    expect(backend.state.calls.some((call) => call.path === '/api/mobile/dashboard?order=12')).toBe(true);
    await screen.findByText('طلب قيد المتابعة');
    expect(screen.getByText('ادفع بالتحويل')).toBeTruthy();
    expect(screen.getByText('9286253712')).toBeTruthy();
    expect(screen.getAllByText('25,000 د.ع').length).toBeGreaterThan(0);
    expect(screen.getPathname()).toBe('/');
  });

  it('signing in from the guest home shows the customer home (no subscription yet)', async () => {
    const { screen } = await startApp();

    fireEvent.press(await screen.findByTestId('guest-login'));
    fireEvent.changeText(await screen.findByTestId('login-phone'), '07700000000');
    fireEvent.changeText(screen.getByTestId('login-password'), 'secret123');
    fireEvent.press(screen.getByTestId('login-submit'));

    await screen.findByText('ابدأ المشاهدة ويا شاشتنا');
    expect(screen.getByText('تصفح الباقات')).toBeTruthy();
    expect(screen.queryByTestId('guest-welcome')).toBeNull();
    expect(screen.getPathname()).toBe('/');
  });

  it('tapping a push opens its typed destination and marks it read', async () => {
    const { screen: router, backend } = await startApp({
      signedIn: true,
      backend: {
        order: makeOrder({ stage: 'PAID', needsPayment: false, status: 'PAID', statusLabel: 'تم الدفع', canCancel: false }),
        notifications: [
          { id: 55, type: 'ORDER_STATUS', title: 'تحديث الطلب', body: 'تم الدفع', imageUrl: null, destination: { kind: 'ORDER', id: 12 }, readAt: null, createdAt: new Date().toISOString() },
        ],
      },
    });
    await router.findByText('طلبك قيد التنفيذ');

    tap({ notificationId: 55, type: 'ORDER_STATUS', link: '/orders/12' });

    await waitFor(() => expect(router.getPathname()).toBe('/orders/12'));
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/notifications/read' && (call.body as { id: number }).id === 55)).toBe(true));

    // An unsafe link never navigates anywhere but the notification centre.
    tap({ notificationId: null, type: 'MESSAGE', link: 'https://phishing.example' });
    await waitFor(() => expect(router.getPathname()).toBe('/notifications'));
    expect((await router.findAllByText('تحديث الطلب')).length).toBeGreaterThan(0);
  });

  it('a deep link to an order while signed out asks for login first, then opens it', async () => {
    const { screen, backend } = await startApp({ url: '/orders/12', backend: { order: makeOrder() } });

    await screen.findByTestId('login-phone');
    expect(backend.state.calls.some((call) => call.path.startsWith('/api/mobile/orders'))).toBe(false);

    fireEvent.changeText(screen.getByTestId('login-phone'), '07700000000');
    fireEvent.changeText(screen.getByTestId('login-password'), 'secret123');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getPathname()).toBe('/orders/12'));
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/orders/12')).toBe(true));
  });

  it('an expired session returned by the server signs the user out', async () => {
    const { screen, backend } = await startApp({ signedIn: true });
    // A revoked token: every authenticated request answers 401.
    backend.fetchImpl.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ success: false, code: 'UNAUTHORIZED', message: 'x' }), { status: 401, headers: { 'Content-Type': 'application/json' } })),
    );

    await screen.findByText('انتهت جلسة تسجيل الدخول. سجّل دخولك مرة ثانية.');
    const secure = jest.requireMock('expo-secure-store') as { __store: Map<string, string> };
    expect(secure.__store.has('shashtna.session.v1')).toBe(false);
  });
});
