import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Catalog, Package } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { DiscountHero, PlanCard, PlatformRow, SectionHeader, VipCard } from '@/src/features/store/StoreCards';
import { packagesOf } from '@/src/lib/catalog';
import { useCatalog, useLoyalty } from '@/src/query/hooks';
import { BrandMark } from '@/src/ui/BrandMark';
import { Panel } from '@/src/ui/Kit';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { EmptyState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

type Filter = 'ALL' | 'IPTV' | 'VIP' | 'DIGITAL';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'الكل' },
  { value: 'IPTV', label: 'اشتراكات IPTV' },
  { value: 'VIP', label: 'باقات VIP + جهاز' },
  { value: 'DIGITAL', label: 'المنصات الرقمية' },
];

/**
 * «الباقات» (Stitch packages store): the biggest live discount, filters, then
 * IPTV plans with their lengths, VIP with devices, and digital platforms by
 * group. Everything comes from the website's catalogue; open to guests.
 */
export default function PackagesScreen() {
  const params = useLocalSearchParams<{ service?: string; renew?: string; upgrade?: string }>();
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const catalog = useCatalog();
  const loyalty = useLoyalty(status === 'signedIn');
  // A home shortcut opens the store on that service; a chip the customer taps wins until the next shortcut.
  const fromLink: Filter = params.service === 'IPTV' || params.service === 'VIP' || params.service === 'DIGITAL' ? params.service : 'ALL';
  const [picked, setPicked] = useState<{ link: string | undefined; value: Filter } | null>(null);
  const filter = picked && picked.link === params.service ? picked.value : fromLink;
  const setFilter = (value: Filter) => setPicked({ link: params.service, value });
  const showPoints = Boolean(loyalty.data?.enabled);

  const available = useMemo(() => FILTERS.filter((item) => item.value === 'ALL' || packagesOf(catalog.data, item.value).length > 0), [catalog.data]);

  return (
    <Screen edges={[]} tabBar contentStyle={[styles.content, { paddingTop: insets.top + space.sm }]} refreshing={catalog.isRefetching} onRefresh={() => void catalog.refetch()}>
      <View style={styles.header}>
        <BrandMark size={40} />
        <View style={styles.flex}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            الباقات
          </Text>
          <Text variant="caption" color={colors.ink2}>
            متجر الاشتراكات والمنصات، بنفس أسعار موقع شاشتنا
          </Text>
        </View>
      </View>

      {params.renew || params.upgrade ? <Notice tone="info">{params.upgrade ? 'اختار الباقة الجديدة وكمّل الطلب.' : 'اختار باقة التجديد وكمّل الطلب.'}</Notice> : null}

      <QueryBoundary query={catalog} rows={3}>
        {(data) => (
          <>
            <DiscountHero packages={data.packages} />

            {available.length > 2 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsWrap}>
                {available.map((item) => {
                  const on = item.value === filter;

                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setFilter(item.value)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: on }}
                      style={[styles.chip, on && styles.chipOn]}
                      testID={`package-filter-${item.value}`}
                    >
                      <Text variant="label" color={on ? colors.onBrand : colors.ink2}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            <Sections catalog={data} filter={filter} showPoints={showPoints} />

            <Panel onPress={() => router.navigate('/support')} accessibilityLabel="محتار شنو يناسبك؟" style={styles.help}>
              <MaterialIcons name="help-outline" size={22} color={colors.brandInk} />
              <View style={styles.flex}>
                <Text variant="label" weight="semibold">
                  محتار شنو يناسبك؟
                </Text>
                <Text variant="caption" color={colors.ink2}>
                  فريق الدعم يساعدك تختار الباقة الصح لجهازك.
                </Text>
              </View>
              <View style={styles.talk}>
                <Text variant="micro" color={colors.ink}>
                  تحدث معنا
                </Text>
              </View>
            </Panel>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

function Sections({ catalog, filter, showPoints }: { catalog: Catalog; filter: Filter; showPoints: boolean }) {
  const iptv = packagesOf(catalog, 'IPTV');
  const vip = packagesOf(catalog, 'VIP');
  const digital = packagesOf(catalog, 'DIGITAL');
  const groups = catalog.groups ?? [];
  const show = (value: Filter) => filter === 'ALL' || filter === value;

  if (!iptv.length && !vip.length && !digital.length) {
    return <EmptyState icon="sparkles-outline" title="ماكو باقات متاحة حالياً" body="ارجع بعد شوية أو تواصل ويا الدعم." />;
  }

  const groupOf = (pkg: Package) => groups.find((group) => group.id === pkg.groupId);
  const iptvGroup = groups.find((group) => group.serviceType === 'IPTV');
  const vipGroup = groups.find((group) => group.serviceType === 'VIP');
  // Platforms in the order the owner set for their groups.
  const platformGroups = groups.filter((group) => group.serviceType === 'DIGITAL');
  const ungrouped = digital.filter((pkg) => !groupOf(pkg));
  const popular = iptv.find((pkg) => pkg.isPopular)?.slug;

  return (
    <>
      {show('IPTV') && iptv.length ? (
        <View style={styles.section} testID="section-iptv">
          <SectionHeader icon="live-tv" title={iptvGroup?.name ?? 'اشتراكات IPTV'} body={iptvGroup?.description ?? 'تشتغل على شاشتك الذكية أو موبايلك بدون أجهزة إضافية.'} />
          {iptv.map((pkg) => (
            <PlanCard key={pkg.id} pkg={pkg} showPoints={showPoints} badge={pkg.slug === popular ? 'الأكثر طلباً' : undefined} />
          ))}
        </View>
      ) : null}

      {show('VIP') && vip.length ? (
        <View style={styles.section} testID="section-vip">
          <SectionHeader icon="workspace-premium" color={colors.amber} title={vipGroup?.name ?? 'باقات VIP + جهاز'} body={vipGroup?.description ?? 'باقات VIP لثلاث أشهر ويا جهاز متوافق.'} />
          {vip.map((pkg) => (
            <VipCard key={pkg.id} pkg={pkg} devices={catalog.devices} />
          ))}
        </View>
      ) : null}

      {show('DIGITAL') && digital.length ? (
        <View style={styles.section} testID="section-digital">
          <SectionHeader icon="redeem" title="المنصات الرقمية" body="اشتراكات وأكواد لمنصاتك المفضلة." />
          {platformGroups.map((group) => {
            const items = digital.filter((pkg) => pkg.groupId === group.id);
            return items.map((pkg) => <PlatformRow key={pkg.id} pkg={pkg} group={group} />);
          })}
          {ungrouped.map((pkg) => (
            <PlatformRow key={pkg.id} pkg={pkg} group={undefined} />
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, gap: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56 },
  chipsWrap: { marginHorizontal: -space.lg, flexGrow: 0 },
  chips: { gap: space.sm, paddingHorizontal: space.lg },
  chip: { minHeight: 44, paddingHorizontal: space.lg, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface3 },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  section: { gap: space.lg },
  help: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  talk: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.surface3 },
});
