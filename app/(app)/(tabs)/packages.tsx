import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ServiceType } from '@/src/api/types';
import { OfferCarousel } from '@/src/features/ContentCards';
import { PackageCard } from '@/src/features/PackageCard';
import { formatPrice } from '@/src/lib/format';
import { useCatalog, useContent } from '@/src/query/hooks';
import { Card } from '@/src/ui/Card';
import { IconWell } from '@/src/ui/IconWell';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { EmptyState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

/** Plans exactly as the admin configured them on the website. */
export default function PackagesScreen() {
  // Arriving from a subscription: pick the plan to upgrade (or renew) to.
  const params = useLocalSearchParams<{ upgrade?: string; renew?: string }>();
  const context = params.upgrade ? { upgrade: params.upgrade } : params.renew ? { renew: params.renew } : undefined;
  const catalog = useCatalog();
  const content = useContent();
  const [type, setType] = useState<ServiceType | 'ALL'>('ALL');

  const types = useMemo(() => [...new Set((catalog.data?.packages ?? []).map((pkg) => pkg.serviceType))], [catalog.data]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen
        edges={[]}
        refreshing={catalog.isRefetching}
        onRefresh={() => {
          void catalog.refetch();
          void content.refetch();
        }}
      >
        <Text variant="title">{context?.upgrade ? 'اختار باقة الترقية' : context?.renew ? 'اختار باقة التجديد' : 'الباقات'}</Text>

        {content.data?.offers.length ? (
          <Section title="عروض حالية">
            <OfferCarousel items={content.data.offers} />
          </Section>
        ) : null}

        {types.length > 1 ? (
          <View style={styles.filters} accessibilityRole="tablist">
            {(['ALL', ...types] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setType(value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: type === value }}
                style={[styles.filter, type === value && styles.filterActive]}
              >
                <Text variant="label" color={type === value ? colors.ink : colors.ink2}>
                  {value === 'ALL' ? 'الكل' : value}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <QueryBoundary query={catalog} rows={3}>
          {(data) => {
            const list = data.packages.filter((pkg) => type === 'ALL' || pkg.serviceType === type);

            return list.length ? (
              <View style={{ gap: space.md }}>
                {list.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} context={context} />
                ))}
                {!context && data.devices.length && (type === 'ALL' || type === 'VIP') ? (
                  <Section title="أجهزة VIP">
                    {data.devices.map((device) => (
                      <Card
                        key={device.id}
                        onPress={() => router.push({ pathname: '/checkout', params: { device: String(device.id) } })}
                        accessibilityLabel={`${device.name}، ${formatPrice(device.price)}`}
                        style={styles.device}
                      >
                        <IconWell name="hardware-chip-outline" tone="warning" />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="label">{device.name}</Text>
                          <Text variant="caption" color={colors.ink3} numberOfLines={2}>
                            {device.description}
                          </Text>
                        </View>
                        <Text variant="label">{formatPrice(device.price)}</Text>
                      </Card>
                    ))}
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

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: space.sm },
  filter: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 40,
    justifyContent: 'center',
  },
  filterActive: { borderColor: colors.brand, backgroundColor: 'rgba(47,107,255,0.18)' },
  device: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
