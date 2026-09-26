import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Package } from '@/src/api/types';
import { formatPrice } from '@/src/lib/format';
import { Badge } from '@/src/ui/Badge';
import { Card } from '@/src/ui/Card';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export function monthly(pkg: Pick<Package, 'price' | 'durationMonths'>) {
  return pkg.durationMonths > 1 ? Math.round(pkg.price / pkg.durationMonths / 250) * 250 : null;
}

export function PackageCard({ pkg }: { pkg: Package }) {
  const perMonth = monthly(pkg);

  return (
    <Card
      glow={pkg.isPopular}
      onPress={() => router.push({ pathname: '/packages/[slug]', params: { slug: pkg.slug } })}
      accessibilityLabel={`${pkg.name}، ${formatPrice(pkg.price)}`}
      style={{ gap: space.md }}
    >
      <View style={styles.top}>
        <Badge label={pkg.serviceType} tone={pkg.serviceType === 'VIP' ? 'warning' : 'brand'} />
        {pkg.isPopular ? <Badge label="الأكثر طلبًا" tone="glow" dot /> : null}
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading">{pkg.name}</Text>
          <Text variant="caption" color={colors.ink3}>
            {pkg.durationLabel}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="heading" color={colors.ink}>
            {formatPrice(pkg.price)}
          </Text>
          {perMonth ? (
            <Text variant="caption" color={colors.ink3}>
              ≈ {formatPrice(perMonth)} / شهر
            </Text>
          ) : null}
        </View>
      </View>
      {pkg.features.slice(0, 3).map((feature) => (
        <View key={feature} style={styles.feature}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text variant="caption" color={colors.ink2} style={{ flex: 1 }}>
            {feature}
          </Text>
        </View>
      ))}
      {pkg.requiresDevice ? (
        <Text variant="caption" color={colors.warning}>
          يتطلب جهاز VIP متوافق (يُضاف سعره للطلب)
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  feature: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
});
