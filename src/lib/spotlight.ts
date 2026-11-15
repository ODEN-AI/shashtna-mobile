import type { Href } from 'expo-router';

import type { Catalog, ContentItem, Dashboard, Package, Subscription, VipDevice } from '@/src/api/types';

import { destinationHref } from './destinations';
import { formatPrice, pluralDays } from './format';

/**
 * Home spotlight — what to feature, built only from real backend records
 * (admin offers, catalogue packages and devices, the customer's own
 * subscription, announcements and incidents). Nothing here invents content.
 *
 * Guests, expired and not-yet-subscribed customers get a promotional story:
 * one product, or sometimes a 2–4 product campaign, rotating on every cold
 * launch so the same item is not repeated. Active subscribers get a Member
 * Spotlight instead (renewal, offers, upgrade, news, service status).
 */

export type SpotlightTarget = { href?: Href; externalUrl?: string; requiresAuth?: boolean };

export type SpotlightItem = {
  key: string;
  kind: 'offer' | 'package' | 'device';
  eyebrow: string;
  title: string;
  body: string | null;
  price: string | null;
  meta: string | null;
  imageUrl: string | null;
  serviceType: 'IPTV' | 'VIP' | null;
  highlight: boolean;
  cta: string;
  target: SpotlightTarget;
};

export type PromoPlan = { mode: 'none' } | { mode: 'single'; items: [SpotlightItem] } | { mode: 'multi'; items: SpotlightItem[] };

export type SpotlightHistory = { recent: string[]; launches: number };

export const EMPTY_HISTORY: SpotlightHistory = { recent: [], launches: 0 };

const RECENT_LIMIT = 12;

function offerTarget(item: ContentItem): SpotlightTarget {
  if (item.cta?.destination) return { href: destinationHref(item.cta.destination) as Href };
  if (item.cta?.externalUrl) return { externalUrl: item.cta.externalUrl };
  return { href: `/content/${item.id}` as Href };
}

export function offerItem(item: ContentItem): SpotlightItem {
  return {
    key: `offer:${item.id}`,
    kind: 'offer',
    eyebrow: 'عرض',
    title: item.title,
    body: item.description,
    price: null,
    meta: null,
    imageUrl: item.imageUrl,
    serviceType: null,
    highlight: true,
    cta: item.cta?.label || 'التفاصيل',
    target: offerTarget(item),
  };
}

export function packageItem(pkg: Package): SpotlightItem {
  return {
    key: `package:${pkg.slug}`,
    kind: 'package',
    eyebrow: pkg.isPopular ? 'الأكثر طلبًا' : `باقة ${pkg.serviceType}`,
    title: pkg.name,
    body: pkg.description || null,
    price: formatPrice(pkg.price),
    meta: pkg.durationLabel,
    imageUrl: pkg.imageUrl,
    serviceType: pkg.serviceType === 'DIGITAL' ? null : pkg.serviceType,
    highlight: pkg.isPopular,
    cta: 'شوف الباقة',
    target: { href: { pathname: '/packages/[slug]', params: { slug: pkg.slug } } },
  };
}

export function deviceItem(device: VipDevice): SpotlightItem {
  return {
    key: `device:${device.id}`,
    kind: 'device',
    eyebrow: 'جهاز VIP',
    title: device.name,
    body: device.description || null,
    price: formatPrice(device.price),
    meta: null,
    imageUrl: device.imageUrl,
    serviceType: 'VIP',
    highlight: false,
    cta: 'اطلب الجهاز',
    target: { href: { pathname: '/checkout', params: { device: String(device.id) } }, requiresAuth: true },
  };
}

/** Every promotable record, most important first (admin offers, then popular packages). */
export function promoCandidates(input: { offers?: ContentItem[]; catalog?: Catalog | null }) {
  const offers = [...(input.offers ?? [])].filter((item) => item.kind === 'OFFER').sort((a, b) => b.priority - a.priority);
  const packages = [...(input.catalog?.packages ?? [])].sort((a, b) => Number(b.isPopular) - Number(a.isPopular));
  const devices = input.catalog?.devices ?? [];

  return {
    offers: offers.map(offerItem),
    products: [...packages.map(packageItem), ...devices.map(deviceItem)],
  };
}

/** Least recently shown first; never-shown items keep their priority order. */
function byFreshness(items: SpotlightItem[], recent: string[]) {
  const rank = (item: SpotlightItem) => {
    const position = recent.indexOf(item.key);
    return position === -1 ? Number.MAX_SAFE_INTEGER : position;
  };

  return items
    .map((item, order) => ({ item, order, rank: rank(item) }))
    .sort((a, b) => b.rank - a.rank || a.order - b.order)
    .map((entry) => entry.item);
}

/**
 * Pick this launch's promotion. Every third launch with at least three
 * products becomes a multi-product campaign (2–4 items); otherwise one item,
 * preferring whatever was shown least recently so it keeps changing.
 */
export function planPromo(
  candidates: { offers: SpotlightItem[]; products: SpotlightItem[] },
  history: SpotlightHistory = EMPTY_HISTORY,
): { plan: PromoPlan; history: SpotlightHistory } {
  const all = [...candidates.offers, ...candidates.products];
  const launches = history.launches + 1;

  if (!all.length) return { plan: { mode: 'none' }, history: { ...history, launches } };

  let plan: PromoPlan;

  if (candidates.products.length >= 3 && launches % 3 === 0) {
    plan = { mode: 'multi', items: byFreshness(candidates.products, history.recent).slice(0, 4) };
  } else {
    plan = { mode: 'single', items: [byFreshness(all, history.recent)[0]] };
  }

  const shown = plan.items.map((item) => item.key);
  const recent = [...shown, ...history.recent.filter((key) => !shown.includes(key))].slice(0, RECENT_LIMIT);

  return { plan, history: { recent, launches } };
}

/**
 * Keep a plan made at launch in sync with fresh data: items the admin removed
 * disappear, and the rest show their current price and text.
 */
export function refreshPlan(plan: PromoPlan, candidates: { offers: SpotlightItem[]; products: SpotlightItem[] }): PromoPlan {
  if (plan.mode === 'none') return plan;
  const current = new Map([...candidates.offers, ...candidates.products].map((item) => [item.key, item]));
  const items = plan.items.map((item) => current.get(item.key)).filter((item): item is SpotlightItem => Boolean(item));

  if (!items.length) return { mode: 'none' };
  if (plan.mode === 'multi' && items.length >= 2) return { mode: 'multi', items };
  return { mode: 'single', items: [items[0]] };
}

// ------------------------------------------------------------------ members

export type MemberSlide = {
  key: string;
  kind: 'renewal' | 'offer' | 'upgrade' | 'news' | 'status' | 'membership';
  icon: string;
  eyebrow: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  cta: string | null;
  target: SpotlightTarget | null;
  tone: 'brand' | 'warning' | 'success' | 'danger' | 'info';
};

function upgradeFor(subscription: Subscription, catalog?: Catalog | null) {
  const current = catalog?.packages.find((pkg) => pkg.slug === subscription.packageSlug || pkg.id === subscription.packageId);
  if (!current) return null;

  return (
    catalog?.packages
      .filter((pkg) => pkg.serviceType === current.serviceType && pkg.durationMonths > current.durationMonths)
      .sort((a, b) => a.durationMonths - b.durationMonths)[0] ?? null
  );
}

/** Member Spotlight slides for an active (or expiring) subscriber. */
export function memberSlides(dashboard: Pick<Dashboard, 'primarySubscription' | 'offers' | 'announcements' | 'incidents'>, catalog?: Catalog | null): MemberSlide[] {
  const subscription = dashboard.primarySubscription;
  const slides: MemberSlide[] = [];

  if (subscription && subscription.canRenew && (subscription.state === 'EXPIRING' || subscription.daysRemaining <= 7)) {
    slides.push({
      key: `renewal:${subscription.id}`,
      kind: 'renewal',
      icon: 'time',
      eyebrow: 'تذكير التجديد',
      title: subscription.daysRemaining > 0 ? `اشتراكك ينتهي بعد ${pluralDays(subscription.daysRemaining)}` : 'اشتراكك ينتهي اليوم',
      body: 'جدّد هسه حتى تبقى المشاهدة بدون انقطاع.',
      imageUrl: null,
      cta: 'جدّد الآن',
      target: { href: { pathname: '/checkout', params: { renew: String(subscription.id) } }, requiresAuth: true },
      tone: 'warning',
    });
  }

  for (const offer of dashboard.offers.slice(0, 3)) {
    slides.push({
      key: `offer:${offer.id}`,
      kind: 'offer',
      icon: 'pricetag',
      eyebrow: 'عرض للمشتركين',
      title: offer.title,
      body: offer.description,
      imageUrl: offer.imageUrl,
      cta: offer.cta?.label || 'التفاصيل',
      target: offerTarget(offer),
      tone: 'brand',
    });
  }

  const upgrade = subscription ? upgradeFor(subscription, catalog) : null;
  if (subscription && upgrade) {
    slides.push({
      key: `upgrade:${upgrade.slug}`,
      kind: 'upgrade',
      icon: 'trending-up',
      eyebrow: 'ترقية متاحة',
      title: `رقِّ إلى ${upgrade.name}`,
      body: `${upgrade.durationLabel} · ${formatPrice(upgrade.price)}`,
      imageUrl: upgrade.imageUrl,
      cta: 'شوف الترقية',
      target: { href: { pathname: '/packages/[slug]', params: { slug: upgrade.slug, upgrade: String(subscription.id) } } },
      tone: 'info',
    });
  }

  for (const news of dashboard.announcements.slice(0, 2)) {
    slides.push({
      key: `news:${news.id}`,
      kind: 'news',
      icon: 'megaphone',
      eyebrow: 'من شاشتنا',
      title: news.title,
      body: news.description,
      imageUrl: news.imageUrl,
      cta: 'اقرأ',
      target: { href: `/content/${news.id}` as Href },
      tone: 'brand',
    });
  }

  const incident = dashboard.incidents[0];
  if (incident) {
    slides.push({
      key: `status:${incident.id}`,
      kind: 'status',
      icon: incident.upcoming || incident.status === 'MAINTENANCE' ? 'construct' : 'warning',
      eyebrow: incident.upcoming ? 'صيانة قادمة' : 'حالة الخدمة',
      title: incident.title,
      body: incident.message,
      imageUrl: null,
      cta: 'التفاصيل',
      target: { href: '/status' },
      tone: incident.status === 'OUTAGE' ? 'danger' : 'warning',
    });
  }

  if (!slides.length && subscription) {
    slides.push({
      key: `membership:${subscription.id}`,
      kind: 'membership',
      icon: 'shield-checkmark',
      eyebrow: 'عضويتك',
      title: 'أنت مشترك بشاشتنا',
      body: `${subscription.packageName} · باقي ${pluralDays(subscription.daysRemaining)}`,
      imageUrl: null,
      cta: 'تفاصيل الاشتراك',
      target: { href: `/subscriptions/${subscription.id}` as Href, requiresAuth: true },
      tone: 'success',
    });
  }

  return slides;
}

/** Start the member carousel at a different slide on each launch. */
export function rotate<T>(items: T[], launches: number) {
  if (items.length < 2) return items;
  const start = launches % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}
