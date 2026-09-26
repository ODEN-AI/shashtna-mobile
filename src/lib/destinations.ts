import type { Destination } from '@/src/api/types';

/**
 * Typed destinations → app routes. The backend sends destinations already
 * parsed; push payloads carry the stored internal link, which is parsed here
 * with the same allow-list as the website (src/lib/destinations.ts there).
 * Anything unknown is ignored — the app never opens arbitrary URLs from a
 * notification.
 */

const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/i;
const TICKET_ID = /^[A-Za-z0-9_-]{1,80}$/;

function positiveId(value: string | undefined) {
  if (!value || !/^\d{1,9}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

export function parseDestinationLink(link: unknown): Destination | null {
  const raw = typeof link === 'string' ? link.trim() : '';

  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || raw.length > 300) {
    return null;
  }

  const [pathPart, queryPart = ''] = raw.split('?');
  let parts: string[];

  try {
    parts = pathPart.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  } catch {
    return null;
  }

  const [head, second, ...rest] = parts;

  if (rest.length) return null;

  switch (head) {
    case undefined:
    case 'dashboard':
      return second === undefined ? { kind: 'HOME' } : null;
    case 'plans':
      return second === undefined ? { kind: 'PLANS' } : null;
    case 'checkout': {
      if (second !== undefined) return null;
      const plan = queryPart
        .split('&')
        .map((pair) => pair.split('='))
        .find(([key]) => key === 'plan')?.[1];
      const slug = plan ? safeDecode(plan) : null;
      return slug && SLUG.test(slug) ? { kind: 'PLAN', slug } : { kind: 'PLANS' };
    }
    case 'announcements': {
      const id = positiveId(second);
      return id ? { kind: 'ANNOUNCEMENT', id } : null;
    }
    case 'orders': {
      if (second === undefined) return { kind: 'ORDERS' };
      const id = positiveId(second);
      return id ? { kind: 'ORDER', id } : null;
    }
    case 'subscriptions': {
      if (second === undefined) return { kind: 'SUBSCRIPTIONS' };
      const id = positiveId(second);
      return id ? { kind: 'SUBSCRIPTION', id } : null;
    }
    case 'support':
      if (second === undefined || second === 'new') return { kind: 'SUPPORT' };
      return TICKET_ID.test(second) ? { kind: 'TICKET', id: second } : null;
    case 'status':
      return second === undefined ? { kind: 'STATUS' } : null;
    case 'notifications':
      return second === undefined ? { kind: 'NOTIFICATIONS' } : null;
    default:
      return null;
  }
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/** Validates a destination object that came over the network. */
export function isDestination(value: unknown): value is Destination {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;

  switch (item.kind) {
    case 'HOME':
    case 'PLANS':
    case 'ORDERS':
    case 'SUBSCRIPTIONS':
    case 'SUPPORT':
    case 'STATUS':
    case 'NOTIFICATIONS':
      return true;
    case 'PLAN':
      return typeof item.slug === 'string' && SLUG.test(item.slug);
    case 'ANNOUNCEMENT':
    case 'ORDER':
    case 'SUBSCRIPTION':
      return typeof item.id === 'number' && Number.isInteger(item.id) && item.id > 0;
    case 'TICKET':
      return typeof item.id === 'string' && TICKET_ID.test(item.id);
    default:
      return false;
  }
}

/** The expo-router href for a destination. */
export function destinationHref(destination: Destination): string {
  switch (destination.kind) {
    case 'HOME':
      return '/';
    case 'PLANS':
      return '/packages';
    case 'PLAN':
      return `/packages/${encodeURIComponent(destination.slug)}`;
    case 'ANNOUNCEMENT':
      return `/content/${destination.id}`;
    case 'ORDERS':
      return '/orders';
    case 'ORDER':
      return `/orders/${destination.id}`;
    case 'SUBSCRIPTIONS':
      return '/subscriptions';
    case 'SUBSCRIPTION':
      return `/subscriptions/${destination.id}`;
    case 'SUPPORT':
      return '/support';
    case 'TICKET':
      return `/support/${encodeURIComponent(destination.id)}`;
    case 'STATUS':
      return '/status';
    case 'NOTIFICATIONS':
      return '/notifications';
  }
}

/** Data carried by a Shashtna push notification (see buildPushMessage on the server). */
export type PushData = { notificationId: number | null; type: string; link: string | null };

export function readPushData(data: unknown): PushData | null {
  if (!data || typeof data !== 'object') return null;
  const value = data as Record<string, unknown>;
  const id = typeof value.notificationId === 'number' && Number.isInteger(value.notificationId) ? value.notificationId : null;

  return {
    notificationId: id,
    type: typeof value.type === 'string' ? value.type.slice(0, 40) : 'MESSAGE',
    link: typeof value.link === 'string' ? value.link : null,
  };
}

/** Where tapping a push should go: its destination, else the notification centre. */
export function pushHref(data: unknown): string {
  const payload = readPushData(data);
  const destination = payload ? parseDestinationLink(payload.link) : null;
  return destination ? destinationHref(destination) : '/notifications';
}
