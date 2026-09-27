import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ServiceType } from '@/src/api/types';
import { useRequireAuth } from '@/src/auth/useRequireAuth';
import { OfferCarousel } from '@/src/features/ContentCards';
import { DeviceCard, PackageCard } from '@/src/features/PackageCard';
import { useCatalog, useContent } from '@/src/query/hooks';
import { FilterChips } from '@/src/ui/FilterChips';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { EmptyState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

/** Plans and devices exactly as the admin configured them on the website. Open to guests. */
export default function PackagesScreen() {
  // Arriving from a subscription: pick the plan to upgrade (or renew) to.
  const params = useLocalSearchParams<{ upgrade?: string; renew?: string }>();
  const context = params.upgrade ? { upgrade: params.upgrade } : params.renew ? { renew: params.renew } : undefined;
  const catalog = useCatalog();
  const content = useContent();
  const { go } = useRequireAuth();
  const [type, setType] = useState<ServiceType | 'ALL'>('ALL');

  const packages = catalog.data?.packages;
  const chips = useMemo(() => {
    const list = packages ?? [];
    const types = [...new Set(list.map((pkg) => pkg.serviceType))];
    return [{ value: 'ALL' as const, label: 'الكل', count: list.length }, ...types.map((value) => ({ value, label: value, count: list.filter((pkg) => pkg.serviceType === value).length }))];
  }, [packages]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen
        edges={[]}
        tabBar
        refreshing={catalog.isRefetching}
        onRefresh={() => {
          void catalog.refetch();
          void content.refetch();
        }}
      >
        <View style={{ gap: space.xs }}>
          <Text variant="title" accessibilityRole="header">
            {context?.upgrade ? 'اختار باقة الترقية' : context?.renew ? 'اختار باقة التجديد' : 'الباقات'}
          </Text>
          <Text color={colors.ink2}>نفس الباقات والأسعار المعتمدة بموقع شاشتنا.</Text>
        </View>

        {context ? <Notice tone="info">{context.upgrade ? 'اختار الباقة الجديدة وكمّل الطلب — تبقى بياناتك نفسها.' : 'اختار باقة التجديد وكمّل الطلب.'}</Notice> : null}

        {!context && content.data?.offers.length ? (
          <Section title="عروض حالية" eyebrow="لفترة محدودة">
            <OfferCarousel items={content.data.offers} />
          </Section>
        ) : null}

        {chips.length > 2 ? <FilterChips items={chips} value={type} onChange={setType} testID="package-filter" /> : null}

        <QueryBoundary query={catalog} rows={3}>
          {(data) => {
            const list = data.packages.filter((pkg) => type === 'ALL' || pkg.serviceType === type);
            const showDevices = !context && data.devices.length > 0 && (type === 'ALL' || type === 'VIP');

            return list.length ? (
              <View style={{ gap: space.lg }}>
                {list.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} context={context} />
                ))}
                {showDevices ? (
                  <Section title="أجهزة VIP" eyebrow="أجهزة متوافقة">
                    <View style={{ gap: space.md }}>
                      {data.devices.map((device) => (
                        <DeviceCard key={device.id} device={device} onPress={() => go({ pathname: '/checkout', params: { device: String(device.id) } })} />
                      ))}
                    </View>
                  </Section>
                ) : null}
              </View>
            ) : (
              <EmptyState icon="sparkles-outline" title="ماكو باقات متاحة حاليًا" body="ارجع بعد شوية أو تواصل ويا الدعم." />
            );
          }}
        </QueryBoundary>
      </Screen>
    </SafeAreaView>
  );
}
