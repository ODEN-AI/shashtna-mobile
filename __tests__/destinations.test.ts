import { destinationHref, isDestination, parseDestinationLink, pushHref, readPushData } from '@/src/lib/destinations';

describe('deep-link parsing (mirrors the website allow-list)', () => {
  it.each([
    ['/dashboard', { kind: 'HOME' }],
    ['/plans', { kind: 'PLANS' }],
    ['/checkout?plan=iptv-12', { kind: 'PLAN', slug: 'iptv-12' }],
    ['/announcements/7', { kind: 'ANNOUNCEMENT', id: 7 }],
    ['/orders', { kind: 'ORDERS' }],
    ['/orders/12', { kind: 'ORDER', id: 12 }],
    ['/subscriptions/3', { kind: 'SUBSCRIPTION', id: 3 }],
    ['/support/ST-ABC-1234', { kind: 'TICKET', id: 'ST-ABC-1234' }],
    ['/support/new', { kind: 'SUPPORT' }],
    ['/status', { kind: 'STATUS' }],
    ['/notifications', { kind: 'NOTIFICATIONS' }],
  ])('%s', (link, expected) => {
    expect(parseDestinationLink(link)).toEqual(expected);
  });

  it.each([
    'https://evil.example/orders/1',
    '//evil.example',
    'javascript:alert(1)',
    'shashtna://orders/1',
    '/\\evil',
    '/admin',
    '/orders/-1',
    '/orders/abc',
    '/orders/1/extra',
    '/announcements',
    '',
    null,
    42,
  ])('rejects %p', (link) => {
    expect(parseDestinationLink(link)).toBeNull();
  });

  it('maps destinations to app routes', () => {
    expect(destinationHref({ kind: 'ORDER', id: 5 })).toBe('/orders/5');
    expect(destinationHref({ kind: 'PLAN', slug: 'vip' })).toBe('/packages/vip');
    expect(destinationHref({ kind: 'ANNOUNCEMENT', id: 2 })).toBe('/content/2');
    expect(destinationHref({ kind: 'TICKET', id: 'ST-1' })).toBe('/support/ST-1');
    expect(destinationHref({ kind: 'HOME' })).toBe('/');
  });

  it('validates destinations received from the API', () => {
    expect(isDestination({ kind: 'ORDER', id: 3 })).toBe(true);
    expect(isDestination({ kind: 'ORDER', id: '3' })).toBe(false);
    expect(isDestination({ kind: 'URL', url: 'https://x' })).toBe(false);
    expect(isDestination(null)).toBe(false);
  });
});

describe('push payloads', () => {
  it('opens the typed destination of a push', () => {
    expect(pushHref({ notificationId: 9, type: 'ORDER_STATUS', link: '/orders/12' })).toBe('/orders/12');
  });

  it('falls back to the notification centre for missing or unsafe links', () => {
    expect(pushHref({ notificationId: 9, type: 'MESSAGE', link: null })).toBe('/notifications');
    expect(pushHref({ link: 'https://phishing.example' })).toBe('/notifications');
    expect(pushHref(undefined)).toBe('/notifications');
  });

  it('reads only known fields', () => {
    expect(readPushData({ notificationId: 4, type: 'OFFER', link: '/plans', extra: 'x' })).toEqual({ notificationId: 4, type: 'OFFER', link: '/plans' });
    expect(readPushData({ notificationId: '4' })).toEqual({ notificationId: null, type: 'MESSAGE', link: null });
  });
});
