import { ApiError } from '@/src/api/client';
import { isExpired } from '@/src/auth/session-store';
import { shouldPersistQuery, shouldRetry } from '@/src/query/client';

const ok = { status: 'success' } as never;

describe('offline cache policy', () => {
  it('persists non-secret data only', () => {
    for (const key of ['dashboard', 'catalog', 'content', 'orders', 'order', 'notifications', 'subscriptions', 'tickets', 'status', 'help']) {
      expect(shouldPersistQuery({ queryKey: [key], state: ok })).toBe(true);
    }
    // Subscription detail carries IPTV credentials; profile stays in memory.
    expect(shouldPersistQuery({ queryKey: ['subscription', 1], state: ok })).toBe(false);
    expect(shouldPersistQuery({ queryKey: ['me'], state: ok })).toBe(false);
    expect(shouldPersistQuery({ queryKey: ['dashboard'], state: { status: 'error' } as never })).toBe(false);
  });

  it('retries network trouble, never validation or auth errors', () => {
    expect(shouldRetry(0, new ApiError('offline', ''))).toBe(true);
    expect(shouldRetry(1, new ApiError('server', ''))).toBe(true);
    expect(shouldRetry(2, new ApiError('server', ''))).toBe(false);
    expect(shouldRetry(0, new ApiError('validation', ''))).toBe(false);
    expect(shouldRetry(0, new ApiError('unauthorized', ''))).toBe(false);
  });

  it('sessions expire a minute early', () => {
    const now = 1_000_000_000;
    expect(isExpired({ expiresAt: now + 30_000 }, now)).toBe(true);
    expect(isExpired({ expiresAt: now + 3_600_000 }, now)).toBe(false);
  });
});
