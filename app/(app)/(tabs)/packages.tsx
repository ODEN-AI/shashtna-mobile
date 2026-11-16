import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Catalog, Package, PackageOption, PlanGroup } from '@/src/api/types';
import { LengthTabs, PlanCard, site } from '@/src/features/store/PlanCard';
import { optionsOf, packagesOf, priceOf, startingPrice } from '@/src/lib/catalog';
import { formatPrice } from '@/src/lib/format';
import { useCatalog } from '@/src/query/hooks';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { EmptyState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { space } from '@/src/ui/theme';

type Filter = 'ALL' | 'IPTV' | 'VIP' | 'DIGITAL';

/**
 * «الباقات»: the website's /plans in the app — the «اختار باقتك» header with
 * each service's starting price, then one section per service with the
 * website's plan cards (art, length, price, monthly equivalent). IPTV gets the
 * length filter and the «الأوفر بالشهر» badge. Everything is read from the
 * catalogue; open to guests.
 */
export default function PackagesScreen() {
  const params = useLocalSearchParams<{ service?: string; renew?: string; upgrade?: string }>();
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();
  // A home shortcut opens the store on that service; tapping a service pill wins until the next shortcut.
  const fromLink: Filter = params.service === 'IPTV' || params.service === 'VIP' || params.service === 'DIGITAL' ? params.service : 'ALL';
  const [picked, setPicked] = useState<{ link: string | undefined; value: Filter } | null>(null);
  const filter = picked && picked.link === params.service ? picked.value : fromLink;
  const setFilter = (value: Filter) => setPicked({ link: params.service, value: value === filter ? 'ALL' : value });

  return (
    <Screen edges={[]} tabBar contentStyle={[styles.content, { paddingTop: insets.top + space.lg }]} refreshing={catalog.isRefetching} onRefresh={() => void catalog.refetch()}>
      {params.renew || params.upgrade ? <Notice tone="info">{params.upgrade ? 'اختار الباقة الجديدة وكمّل الطلب.' : 'اختار باقة التجديد وكمّل الطلب.'}</Notice> : null}

      <QueryBoundary query={catalog} rows={3}>
        {(data) =>
          data.packages.length ? (
            <>
              <Hero catalog={data} filter={filter} onFilter={setFilter} />
              <Sections catalog={data} filter={filter} />
              <Pressable onPress={() => router.navigate('/support')} accessibilityRole="button" style={styles.help}>
                <MaterialIcons name="help-outline" size={22} color={site.sky} />
                <View style={styles.flex}>
                  <Text variant="label" weight="semibold" color={site.ink}>
                    محتار شنو يناسبك؟
                  </Text>
                  <Text variant="caption" color={site.ink3}>
                    فريق الدعم يساعدك تختار الباقة الصح لجهازك.
                  </Text>
                </View>
                <MaterialIcons name="chevron-left" size={22} color={site.ink3} />
              </Pressable>
            </>
          ) : (
            <EmptyState icon="sparkles-outline" title="ماكو باقات متاحة حالياً" body="ارجع بعد شوية أو تواصل ويا الدعم." />
          )
        }
      </QueryBoundary>
    </Screen>
  );
}

const SERVICES: { value: Exclude<Filter, 'ALL'>; title: string; sub: string }[] = [
  { value: 'IPTV', title: 'IPTV', sub: 'على جهازك الحالي' },
  { value: 'VIP', title: 'VIP', sub: 'ويا جهاز مخصص' },
  { value: 'DIGITAL', title: 'المنصات', sub: 'اشتراكات وأكواد' },
];

/** The website's «اختار باقتك» header: what is on sale, and a pill per service with its starting price. */
function Hero({ catalog, filter, onFilter }: { catalog: Catalog; filter: Filter; onFilter: (value: Filter) => void }) {
  const services = SERVICES.map((service) => ({ ...service, from: startingPrice(catalog, service.value) })).filter((service) => service.from !== null);

  return (
    <View style={styles.hero} testID="store-hero">
      <View style={styles.eyebrow}>
        <View style={styles.eyebrowDot} />
        <Text variant="label" color={site.sky}>
          الباقات والأسعار
        </Text>
      </View>
      <Text color={site.ink} style={styles.heroTitle} accessibilityRole="header">
        اختار باقتك
      </Text>
      <Text variant="body" color={site.ink2} style={styles.heroBody}>
        IPTV تشتغل على جهازك الحالي، وVIP تجي ويا جهاز مخصص. كل الأسعار بالدينار العراقي، والسعر اللي تشوفه هو اللي تحوّله.
      </Text>
      <View style={styles.pills}>
        {services.map((service) => {
          const on = filter === service.value;
          const vip = service.value === 'VIP';

          return (
            <Pressable
              key={service.value}
              onPress={() => onFilter(service.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.pill, on && styles.pillOn]}
              testID={`package-filter-${service.value}`}
            >
              <View style={styles.flex}>
                <Text variant="label" weight="bold" color={site.ink}>
                  {service.title}
                </Text>
                <Text variant="micro" color={site.ink3} style={{ fontSize: 12 }}>
                  {service.sub}
                </Text>
              </View>
              <View style={[styles.pillPrice, vip ? styles.pillPriceVip : null]}>
                <Text variant="label" weight="bold" color={vip ? '#2A1D05' : '#FFFFFF'} style={styles.nums}>
                  من {formatPrice(service.from!)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Sections({ catalog, filter }: { catalog: Catalog; filter: Filter }) {
  const show = (value: Filter) => filter === 'ALL' || filter === value;
  const groups = catalog.groups ?? [];
  const iptv = packagesOf(catalog, 'IPTV');
  const vip = packagesOf(catalog, 'VIP');
  const digital = packagesOf(catalog, 'DIGITAL');
  const iptvGroup = groups.find((group) => group.serviceType === 'IPTV');
  const vipGroup = groups.find((group) => group.serviceType === 'VIP');
  const platformGroups = groups.filter((group) => group.serviceType === 'DIGITAL');
  const ungrouped = digital.filter((pkg) => !platformGroups.some((group) => group.id === pkg.groupId));

  return (
    <>
      {show('IPTV') && iptv.length ? (
        <Section testID="section-iptv" title={iptvGroup?.name ?? 'IPTV'} body={iptvGroup?.description ?? 'قنوات وأفلام ومسلسلات على التلفزيون أو الموبايل اللي عندك. بعد التفعيل تستلم اسم مستخدم وكلمة مرور بحسابك.'}>
          <IptvBoard plans={iptv} />
        </Section>
      ) : null}

      {show('VIP') && vip.length ? (
        <Section testID="section-vip" title={vipGroup?.name ?? 'VIP'} gold body={vipGroup?.description ?? 'باقات VIP لثلاث أشهر، ويا جهاز متوافق تختاره عند الطلب.'}>
          {vip.map((pkg) => {
            const devices = catalog.devices.filter((device) => device.packageIds.includes(pkg.id));
            const deviceFrom = devices.length ? Math.min(...devices.map((device) => device.price)) : null;
            const art = devices.find((device) => device.imageUrl)?.imageUrl ?? null;
            return <PlanCard key={pkg.id} pkg={pkg} art={art} deviceFrom={deviceFrom} />;
          })}
        </Section>
      ) : null}

      {show('DIGITAL')
        ? platformGroups.map((group) => {
            const items = digital.filter((pkg) => pkg.groupId === group.id);
            return items.length ? <PlatformSection key={group.id} group={group} items={items} /> : null;
          })
        : null}
      {show('DIGITAL') && ungrouped.length ? (
        <Section testID="section-digital" title="المنصات الرقمية" body="اشتراكات وأكواد لمنصاتك المفضلة.">
          {ungrouped.map((pkg) => (
            <PlanCard key={pkg.id} pkg={pkg} />
          ))}
        </Section>
      ) : null}
    </>
  );
}

function Section({ title, body, gold, children, testID, logo }: { title: string; body?: string | null; gold?: boolean; children: React.ReactNode; testID?: string; logo?: string | null }) {
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.sectionHead}>
        <View style={styles.titleRow}>
          {logo ? <Image source={logo} style={styles.groupLogo} contentFit="contain" /> : null}
          <Text color={gold ? site.gold : site.ink} style={styles.sectionTitle} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {body ? (
          <Text variant="body" color={site.ink2} style={{ fontSize: 15, lineHeight: 26 }}>
            {body}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function PlatformSection({ group, items }: { group: PlanGroup; items: Package[] }) {
  return (
    <Section title={group.name} body={group.description} logo={group.logoUrl} testID={`section-group-${group.slug}`}>
      {items.map((pkg) => (
        <PlanCard key={pkg.id} pkg={pkg} art={group.logoUrl} />
      ))}
    </Section>
  );
}

/** IPTV: the length filter, and the plan with the lowest monthly price marked «الأوفر بالشهر». */
function IptvBoard({ plans }: { plans: Package[] }) {
  const [length, setLength] = useState<number | 'all'>('all');
  const lengths = useMemo(() => [...new Set(plans.flatMap((pkg) => optionsOf(pkg).map((option) => option.durationMonths)))].sort((a, b) => a - b), [plans]);

  const shown = plans.flatMap((pkg): { pkg: Package; option: PackageOption | null }[] => {
    if (length === 'all') return [{ pkg, option: null }];
    const option = optionsOf(pkg).find((item) => item.durationMonths === length);
    return option ? [{ pkg, option }] : [];
  });

  const perMonth = (item: (typeof shown)[number]) => {
    const option = item.option ?? optionsOf(item.pkg)[0];
    return priceOf(option).now / Math.max(1, option.durationMonths);
  };
  const best = shown.length > 1 ? shown.reduce((a, b) => (perMonth(b) < perMonth(a) ? b : a)).pkg.id : null;

  return (
    <>
      {lengths.length > 1 ? <LengthTabs lengths={lengths} value={length} onChange={setLength} /> : null}
      {shown.map((item) => (
        <PlanCard key={item.pkg.id} pkg={item.pkg} option={item.option} best={item.pkg.id === best} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  nums: { fontVariant: ['tabular-nums'] },
  content: { paddingHorizontal: space.lg, gap: space.xxl },
  hero: {
    gap: space.md,
    padding: space.xl,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: site.line,
    backgroundColor: site.panel,
    experimental_backgroundImage: `radial-gradient(circle at 20% 0%, rgba(31, 79, 255, 0.35) 0%, rgba(31, 79, 255, 0) 70%), linear-gradient(180deg, ${site.panel2}, ${site.panel})`,
  },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  eyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: site.sky },
  heroTitle: { fontSize: 40, lineHeight: 52, fontWeight: '700' },
  heroBody: { fontSize: 16, lineHeight: 28 },
  pills: { gap: space.md, marginTop: space.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64, paddingStart: space.lg, paddingEnd: 6, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: site.line, backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  pillOn: { borderColor: site.sky, backgroundColor: 'rgba(92, 200, 255, 0.08)' },
  pillPrice: { paddingHorizontal: space.lg, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: site.royal },
  pillPriceVip: { backgroundColor: '#D9AD4F', experimental_backgroundImage: 'linear-gradient(135deg, #F6DC95, #D9AD4F)' },
  section: { gap: space.lg },
  sectionHead: { gap: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  sectionTitle: { fontSize: 40, lineHeight: 50, fontWeight: '700' },
  groupLogo: { width: 44, height: 44, borderRadius: 12 },
  help: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, minHeight: 64, borderRadius: 20, borderWidth: 1, borderColor: site.line, backgroundColor: site.panel },
});
