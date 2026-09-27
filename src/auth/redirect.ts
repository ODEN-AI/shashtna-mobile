import type { Href } from 'expo-router';

/**
 * Where to continue after signing in. A guest who taps "order" (or opens a
 * link to an account screen) is sent to login; once signed in they land on
 * what they asked for instead of the home screen.
 */
let pending: Href | null = null;

export function setPendingRedirect(href: Href | null) {
  pending = href;
}

export function takePendingRedirect() {
  const href = pending;
  pending = null;
  return href;
}

type Params = Record<string, string | string[] | undefined>;

/**
 * The URL of the current route from its segments, e.g.
 * ['(app)', '(member)', 'orders', '[id]'] + { id: '12' } → /orders/12.
 * Params that are not part of the path are kept as the query.
 */
export function hrefFromSegments(segments: readonly string[], params: Params): Href | null {
  const used = new Set<string>();
  const parts: string[] = [];

  for (const segment of segments) {
    if (segment.startsWith('(') && segment.endsWith(')')) continue;
    const dynamic = segment.match(/^\[(\.\.\.)?(.+)\]$/);

    if (!dynamic) {
      if (segment !== 'index') parts.push(segment);
      continue;
    }

    const value = params[dynamic[2]];
    if (value === undefined) return null;
    used.add(dynamic[2]);
    parts.push(...(Array.isArray(value) ? value : [value]).map(encodeURIComponent));
  }

  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!used.has(key) && typeof value === 'string') query[key] = value;
  }

  return { pathname: `/${parts.join('/')}`, params: query } as Href;
}
