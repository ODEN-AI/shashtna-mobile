import { router } from 'expo-router';

import type { Package } from '@/src/api/types';

/** Opens the package page (lengths, features, total) with a length already chosen. */
export function openPackage(pkg: Package, optionId?: number, renew?: string) {
  router.push({
    pathname: '/packages/[slug]',
    params: { slug: pkg.slug, ...(optionId ? { option: String(optionId) } : {}), ...(renew ? { renew } : {}) },
  });
}

/** Points an order of this price earns (the server's rule: 1 per 1,000 IQD for IPTV, 5,000 for platforms, or the option's own number). */
export function pointsFor(price: number, override: number | null, serviceType: string) {
  if (serviceType === 'VIP') return null;
  return override ?? Math.floor(price / (serviceType === 'DIGITAL' ? 5000 : 1000));
}
