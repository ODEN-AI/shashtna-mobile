import { act, fireEvent, renderRouter, waitFor } from 'expo-router/testing-library';
import * as Notifications from 'expo-notifications';

import { configureApi } from '@/src/api/client';

import { createBackend, makeOrder } from './support/fake-backend';

jest.mock('@/src/lib/config', () => ({ API_BASE_URL: 'https://api.test', APP_VERSION: '2.0.0', EAS_PROJECT_ID: 'test-project' }));

jest.setTimeout(20_000);

const listeners = (Notifications as unknown as { __listeners: { received: ((n: unknown) => void)[]; response: ((r: unknown) => void)[] } }).__listeners;

function tap(data: unknown) {
  act(() => {
    for (const listener of listeners.response) {
      listener({ actionIdentifier: 'default', notification: { request: { identifier: `id-${Math.random()}`, content: { data } } } });
    }
  });
}

beforeEach(async () => {
  listeners.received.length = 0;
  listeners.response.length = 0;
  const store = (jest.requireMock('expo-secure-store') as { __store: Map<string, string> }).__store;
  store.clear();
});

describe('customer journey (router + providers + API client)', () => {
  it('login → dashboard → packages → order → payment details', async () => {
    const backend = createBackend();
    configureApi({ fetchImpl: backend.fetchImpl as unknown as typeof fetch });

    const screen = renderRouter('./app', { initialUrl: '/' });

    // Signed out: the login screen is shown.
    await screen.findByText('أهلًا بيك بشاشتنا');

    fireEvent.changeText(screen.getByTestId('login-phone'), '07700000000');
    fireEvent.changeText(screen.getByTestId('login-password'), 'wrong');
    fireEvent.press(screen.getByTestId('login-submit'));
    await screen.findByText('رقم الهاتف أو كلمة المرور غير صحيحة.');

    fireEvent.changeText(screen.getByTestId('login-password'), 'secret123');
    fireEvent.press(screen.getByTestId('login-submit'));

    // Dashboard with no subscription.
    await screen.findByText('ابدأ المشاهدة ويا شاشتنا');
    // Push token registered for this account after login.
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/devices' && call.method === 'POST')).toBe(true));
    const device = backend.state.calls.find((call) => call.path === '/api/mobile/devices')!.body as Record<string, unknown>;
    expect(device).toMatchObject({ token: 'ExponentPushToken[testtesttesttest]', platform: expect.any(String) });

    // Packages from the backend.
    fireEvent.press(screen.getByText('تصفح الباقات'));
    await screen.findByText('IPTV سنة');
    fireEvent.press(screen.getByText('IPTV سنة'));

    fireEvent.press(await screen.findByTestId('order-package'));

    // Checkout: same sections as the website, contact method chosen per order.
    await screen.findByText('بيانات العميل');
    expect((await screen.findAllByText('طريقة التواصل')).length).toBe(2);
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

  it('tapping a push opens its typed destination and marks it read', async () => {
    const backend = createBackend({
      order: makeOrder({ stage: 'PAID', needsPayment: false, status: 'PAID', statusLabel: 'تم الدفع', canCancel: false }),
      notifications: [
        { id: 55, type: 'ORDER_STATUS', title: 'تحديث الطلب', body: 'تم الدفع', imageUrl: null, destination: { kind: 'ORDER', id: 12 }, readAt: null, createdAt: new Date().toISOString() },
      ],
    });
    configureApi({ fetchImpl: backend.fetchImpl as unknown as typeof fetch });

    const secure = jest.requireMock('expo-secure-store') as { __store: Map<string, string> };
    secure.__store.set('shashtna.session.v1', JSON.stringify({ token: 'tkn', expiresAt: Date.now() + 86_400_000, user: { id: 7, name: 'علي', phone: '077' } }));

    const router = renderRouter('./app', { initialUrl: '/' });
    const screen = router;
    await screen.findByText('طلبك قيد التنفيذ');

    tap({ notificationId: 55, type: 'ORDER_STATUS', link: '/orders/12' });

    await waitFor(() => expect(router.getPathname()).toBe('/orders/12'));
    await waitFor(() => expect(backend.state.calls.some((call) => call.path === '/api/mobile/notifications/read' && (call.body as { id: number }).id === 55)).toBe(true));

    // An unsafe link never navigates anywhere but the notification centre.
    tap({ notificationId: null, type: 'MESSAGE', link: 'https://phishing.example' });
    await waitFor(() => expect(router.getPathname()).toBe('/notifications'));
    await screen.findByText('تحديث الطلب');
  });

  it('deep link to an order while signed out asks for login first', async () => {
    const backend = createBackend();
    configureApi({ fetchImpl: backend.fetchImpl as unknown as typeof fetch });

    const screen = renderRouter('./app', { initialUrl: '/orders/12' });
    await screen.findByText('أهلًا بيك بشاشتنا');
    expect(backend.state.calls.some((call) => call.path.startsWith('/api/mobile/orders'))).toBe(false);
  });

  it('an expired session returned by the server signs the user out', async () => {
    const backend = createBackend();
    configureApi({ fetchImpl: backend.fetchImpl as unknown as typeof fetch });
    // Stored token the server rejects: fetchImpl answers 401 only when no Authorization header,
    // so simulate a revoked token by answering 401 for /me.
    backend.fetchImpl.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ success: false, code: 'UNAUTHORIZED', message: 'x' }), { status: 401, headers: { 'Content-Type': 'application/json' } })),
    );

    const secure = jest.requireMock('expo-secure-store') as { __store: Map<string, string> };
    secure.__store.set('shashtna.session.v1', JSON.stringify({ token: 'revoked', expiresAt: Date.now() + 86_400_000, user: { id: 7, name: 'علي', phone: '077' } }));

    const screen = renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('انتهت جلسة تسجيل الدخول. سجّل دخولك مرة ثانية.');
    expect(secure.__store.has('shashtna.session.v1')).toBe(false);
  });
});
