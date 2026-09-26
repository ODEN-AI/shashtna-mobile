import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { RequestType } from '@/src/api/types';
import { monthly } from '@/src/features/PackageCard';
import { formatPrice } from '@/src/lib/format';
import { useCatalog } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { EmptyState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

const TYPE_TITLE: Record<RequestType, string> = {
  NEW: 'اشتراك جديد',
  RENEW: 'تجديد الاشتراك',
  UPGRADE: 'ترقية الاشتراك',
  DEVICE_PURCHASE: 'شراء جهاز',
};

/** Package details; ordering continues to the checkout confirmation. */
export default function PackageScreen() {
  const params = useLocalSearchParams<{ slug: string; renew?: string; upgrade?: string }>();
  const catalog = useCatalog();
  const pkg = catalog.data?.packages.find((item) => item.slug === params.slug);
  const requestType: RequestType = params.renew ? 'RENEW' : params.upgrade ? 'UPGRADE' : 'NEW';

  function order() {
    if (!pkg) return;
    router.push({
      pathname: '/checkout',
      params: { plan: pkg.slug, ...(params.renew ? { renew: params.renew } : {}), ...(params.upgrade ? { upgrade: params.upgrade } : {}) },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: pkg?.name ?? 'الباقة' }} />
      <Screen
        refreshing={catalog.isRefetching}
        onRefresh={() => void catalog.refetch()}
        footer={
          pkg ? (
            <Button
              title={requestType === 'RENEW' ? 'جدّد بهذه الباقة' : requestType === 'UPGRADE' ? 'رقِّ لهذه الباقة' : 'اطلب هذه الباقة'}
              icon="cart"
              onPress={order}
              testID="order-package"
            />
          ) : null
        }
      >
        <QueryBoundary query={catalog} rows={2}>
          {() =>
            !pkg ? (
              <EmptyState icon="alert-circle-outline" tone="warning" title="هذه الباقة غير متاحة حاليًا" body="ممكن الإدارة أوقفتها أو غيّرتها. شوف الباقات المتاحة." action={<Button title="الباقات المتاحة" onPress={() => router.replace('/packages')} />} />
            ) : (
              <>
                {pkg.imageUrl ? <Image source={pkg.imageUrl} style={styles.image} contentFit="cover" transition={200} /> : null}

                <View style={{ gap: space.sm }}>
                  <View style={styles.badges}>
                    <Badge label={pkg.serviceType} tone={pkg.serviceType === 'VIP' ? 'warning' : 'brand'} />
                    {requestType !== 'NEW' ? <Badge label={TYPE_TITLE[requestType]} tone="info" /> : null}
                    {pkg.isPopular ? <Badge label="الأكثر طلبًا" tone="glow" /> : null}
                  </View>
                  <Text variant="title">{pkg.name}</Text>
                  <Text color={colors.ink2}>{pkg.description}</Text>
                </View>

                <Card style={styles.price}>
                  <View>
                    <Text variant="caption" color={colors.ink3}>
                      السعر · {pkg.durationLabel}
                    </Text>
                    <Text variant="title">{formatPrice(pkg.price)}</Text>
                  </View>
                  {monthly(pkg) ? (
                    <Text variant="caption" color={colors.ink3}>
                      ≈ {formatPrice(monthly(pkg)!)} / شهر
                    </Text>
                  ) : null}
                </Card>

                {pkg.features.length ? (
                  <Card style={{ gap: space.md }}>
                    <Text variant="heading">شنو تحصل</Text>
                    {pkg.features.map((feature) => (
                      <View key={feature} style={styles.feature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                        <Text style={{ flex: 1 }}>{feature}</Text>
                      </View>
                    ))}
                    {pkg.notes ? (
                      <Text variant="caption" color={colors.ink3}>
                        {pkg.notes}
                      </Text>
                    ) : null}
                  </Card>
                ) : null}

                {pkg.requiresDevice ? <Notice tone="info">باقات VIP تكون ويا جهاز VIP متوافق — تختاره بخطوة تأكيد الطلب.</Notice> : null}
              </>
            )
          }
        </QueryBoundary>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.surface2 },
  badges: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  price: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  feature: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
});
