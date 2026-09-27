import type { Catalog, ContentItem, Dashboard, Package } from '@/src/api/types';
import { EMPTY_HISTORY, memberSlides, planPromo, promoCandidates, refreshPlan, rotate, type SpotlightHistory } from '@/src/lib/spotlight';

const pkg = (slug: string, extra: Partial<Package> = {}): Package => ({
  id: slug.length,
  name: slug,
  slug,
  serviceType: 'IPTV',
  price: 10000,
  durationMonths: 1,
  durationLabel: '1 Month',
  description: '',
  features: [],
  notes: null,
  imageUrl: null,
  isPopular: false,
  requiresDevice: false,
  ...extra,
});

const offer = (id: number, priority = 0): ContentItem => ({
  id,
  kind: 'OFFER',
  title: `عرض ${id}`,
  description: null,
  imageUrl: null,
  style: 'DEFAULT',
  placement: 'HOME',
  priority,
  startsAt: null,
  endsAt: null,
  updatedAt: '2026-09-01',
  cta: null,
});

const catalog = (packages: Package[]): Catalog => ({ packages, devices: [], currency: 'IQD' });

function launches(candidates: ReturnType<typeof promoCandidates>, count: number) {
  let history: SpotlightHistory = EMPTY_HISTORY;
  const shown: string[][] = [];
  for (let i = 0; i < count; i++) {
    const result = planPromo(candidates, history);
    history = result.history;
    shown.push(result.plan.mode === 'none' ? [] : result.plan.items.map((item) => item.key));
  }
  return shown;
}

describe('promotional spotlight', () => {
  it('shows nothing when the backend has nothing to promote (no invented content)', () => {
    expect(planPromo(promoCandidates({ offers: [], catalog: catalog([]) })).plan).toEqual({ mode: 'none' });
  });

  it('puts admin offers first, then popular packages', () => {
    const candidates = promoCandidates({ offers: [offer(1, 1), offer(2, 5)], catalog: catalog([pkg('a'), pkg('b', { isPopular: true })]) });
    expect(candidates.offers.map((item) => item.key)).toEqual(['offer:2', 'offer:1']);
    expect(candidates.products.map((item) => item.key)).toEqual(['package:b', 'package:a']);
  });

  it('changes on every cold launch and does not repeat until everything was shown', () => {
    const candidates = promoCandidates({ offers: [offer(1)], catalog: catalog([pkg('a'), pkg('b')]) });
    const shown = launches(candidates, 3).map((keys) => keys[0]);
    expect(new Set(shown).size).toBe(3);
    // Fourth launch starts over with the least recently shown item.
    expect(launches(candidates, 4)[3]).toEqual([shown[0]]);
  });

  it('turns every third launch into a 2–4 product campaign when there are enough products', () => {
    const candidates = promoCandidates({ offers: [], catalog: catalog(['a', 'b', 'c', 'd', 'e'].map((slug) => pkg(slug))) });
    const result = launches(candidates, 3);
    expect(result[0]).toHaveLength(1);
    expect(result[1]).toHaveLength(1);
    expect(result[2].length).toBeGreaterThanOrEqual(2);
    expect(result[2].length).toBeLessThanOrEqual(4);
  });

  it('never makes a campaign out of fewer than three products', () => {
    const candidates = promoCandidates({ offers: [offer(9)], catalog: catalog([pkg('a'), pkg('b')]) });
    expect(launches(candidates, 6).every((keys) => keys.length === 1)).toBe(true);
  });

  it('follows live data: removed items disappear, prices update', () => {
    const before = promoCandidates({ offers: [], catalog: catalog([pkg('a', { price: 1000 })]) });
    const { plan } = planPromo(before);
    const updated = refreshPlan(plan, promoCandidates({ offers: [], catalog: catalog([pkg('a', { price: 2000 })]) }));
    expect(updated.mode === 'single' && updated.items[0].price).toBe('2,000 د.ع');
    expect(refreshPlan(plan, promoCandidates({ offers: [], catalog: catalog([]) }))).toEqual({ mode: 'none' });
  });

  it('devices ask guests to sign in (they open checkout)', () => {
    const candidates = promoCandidates({ catalog: { packages: [], devices: [{ id: 3, name: 'X', slug: 'x', price: 1, description: '', features: [], notes: null, imageUrl: null, packageIds: [] }], currency: 'IQD' } });
    expect(candidates.products[0].target.requiresAuth).toBe(true);
  });
});

describe('member spotlight', () => {
  const subscription = {
    id: 5,
    serviceType: 'IPTV',
    packageName: 'IPTV شهر',
    packageId: 1,
    packageSlug: 'month',
    status: 'ACTIVE',
    state: 'ACTIVE' as const,
    stateLabel: 'نشط',
    daysRemaining: 25,
    remainingFraction: 0.8,
    startDate: '',
    expiryDate: '',
    maxConnections: 1,
    createdAt: '',
    canRenew: true,
    credentials: null,
  };
  const base: Pick<Dashboard, 'primarySubscription' | 'offers' | 'announcements' | 'incidents'> = { primarySubscription: subscription, offers: [], announcements: [], incidents: [] };

  it('reminds to renew only when the subscription is ending', () => {
    expect(memberSlides(base).some((slide) => slide.kind === 'renewal')).toBe(false);
    const ending = memberSlides({ ...base, primarySubscription: { ...subscription, state: 'EXPIRING', daysRemaining: 3 } });
    expect(ending[0]).toMatchObject({ kind: 'renewal', title: 'اشتراكك ينتهي بعد 3 أيام' });
  });

  it('suggests an upgrade only when the catalogue really has a longer plan of the same service', () => {
    const plans = catalog([pkg('month', { id: 1, durationMonths: 1 }), pkg('year', { id: 2, durationMonths: 12 }), pkg('vip', { serviceType: 'VIP', durationMonths: 24 })]);
    const upgrade = memberSlides(base, plans).find((slide) => slide.kind === 'upgrade');
    expect(upgrade?.target?.href).toEqual({ pathname: '/packages/[slug]', params: { slug: 'year', upgrade: '5' } });
    expect(memberSlides(base, catalog([pkg('month', { id: 1 })])).some((slide) => slide.kind === 'upgrade')).toBe(false);
  });

  it('includes real offers, news and incidents, and falls back to the membership itself', () => {
    const slides = memberSlides({
      ...base,
      offers: [offer(1)],
      announcements: [{ ...offer(2), kind: 'ANNOUNCEMENT' }],
      incidents: [{ id: 4, title: 'صيانة', message: 'م', status: 'MAINTENANCE', component: 'IPTV', startsAt: '', resolvedAt: null, updatedAt: '', upcoming: true }],
    });
    expect(slides.map((slide) => slide.kind)).toEqual(['offer', 'news', 'status']);
    expect(memberSlides(base).map((slide) => slide.kind)).toEqual(['membership']);
  });

  it('starts at a different slide on each launch', () => {
    expect(rotate([1, 2, 3], 1)).toEqual([2, 3, 1]);
    expect(rotate([1, 2, 3], 3)).toEqual([1, 2, 3]);
  });
});
