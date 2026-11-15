import type { Catalog, Package, PackageOption } from '@/src/api/types';

/**
 * Reading the catalogue the server sends. Every price here was computed by
 * the website (options, renewal prices, discounts); the app only chooses
 * which of those numbers to show. Orders are always priced again on the server.
 */

/** The lengths a package is sold in, shortest first (older servers: the package itself). */
export function optionsOf(pkg: Package): PackageOption[] {
  if (pkg.options?.length) return [...pkg.options].sort((a, b) => a.durationMonths - b.durationMonths);

  return [
    {
      id: 0,
      durationMonths: pkg.durationMonths,
      durationLabel: pkg.durationLabel,
      price: pkg.price,
      renewalPrice: pkg.renewalPrice ?? pkg.price,
      pointsEarned: null,
      discount: null,
    },
  ];
}

export type Mode = 'NEW' | 'RENEW';

/** What this length costs now, and the price before a discount when there is one. */
export function priceOf(option: PackageOption, mode: Mode = 'NEW'): { now: number; before: number | null } {
  const list = mode === 'RENEW' ? option.renewalPrice : option.price;
  const discount = option.discount;
  const discounted = !discount ? null : mode === 'RENEW' ? (discount.appliesToRenewals ? discount.renewalPrice : null) : discount.price;

  return discounted !== null && discounted < list ? { now: discounted, before: list } : { now: list, before: null };
}

/** The cheapest price a customer can start from in a service (null when nothing is on sale). */
export function startingPrice(catalog: Catalog | undefined, serviceType: string) {
  const prices = (catalog?.packages ?? [])
    .filter((pkg) => pkg.serviceType === serviceType)
    .flatMap((pkg) => optionsOf(pkg).map((option) => priceOf(option).now));

  return prices.length ? Math.min(...prices) : null;
}

/** The monthly equivalent, rounded down to whole dinars (shown only for lengths over a month). */
export function perMonth(price: number, months: number) {
  return months > 1 ? Math.floor(price / months) : null;
}

export function packagesOf(catalog: Catalog | undefined, serviceType: string) {
  return (catalog?.packages ?? []).filter((pkg) => pkg.serviceType === serviceType);
}
