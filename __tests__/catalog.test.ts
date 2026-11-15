import type { Package } from '@/src/api/types';
import { optionsOf, perMonth, priceOf, startingPrice } from '@/src/lib/catalog';

const option = (id: number, months: number, price: number, extra = {}) => ({
  id,
  durationMonths: months,
  durationLabel: `${months}`,
  price,
  renewalPrice: price - 500,
  pointsEarned: null,
  discount: null,
  ...extra,
});

const pkg = (options: ReturnType<typeof option>[]): Package => ({
  id: 1,
  name: 'IPTV',
  slug: 'iptv',
  serviceType: 'IPTV',
  price: 9,
  durationMonths: 1,
  durationLabel: '1',
  options,
  description: '',
  features: [],
  notes: null,
  imageUrl: null,
  isPopular: false,
  requiresDevice: false,
});

describe('catalogue reading', () => {
  it('orders lengths shortest first and falls back to the package', () => {
    expect(optionsOf(pkg([option(2, 12, 18000), option(1, 3, 6000)])).map((o) => o.id)).toEqual([1, 2]);
    expect(optionsOf({ ...pkg([]), options: undefined })[0]).toMatchObject({ price: 9, durationMonths: 1 });
  });

  it('uses the discount the server computed, and renewals only when the discount covers them', () => {
    const discounted = option(1, 3, 6000, {
      discount: { id: 1, kind: 'PERCENT', value: 10, appliesToRenewals: false, endsAt: null, endsInDays: null, price: 5400, renewalPrice: null },
    });
    expect(priceOf(discounted)).toEqual({ now: 5400, before: 6000 });
    expect(priceOf(discounted, 'RENEW')).toEqual({ now: 5500, before: null });
  });

  it('finds the starting price of a service and the monthly equivalent', () => {
    const catalog = { packages: [pkg([option(1, 3, 6000), option(2, 12, 18000)])], devices: [], currency: 'IQD' };
    expect(startingPrice(catalog, 'IPTV')).toBe(6000);
    expect(startingPrice(catalog, 'VIP')).toBeNull();
    expect(perMonth(18000, 12)).toBe(1500);
    expect(perMonth(6000, 1)).toBeNull();
  });
});
