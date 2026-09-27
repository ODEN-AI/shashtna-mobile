import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Package, VipDevice } from '@/src/api/types';
import { formatPrice } from '@/src/lib/format';
import { Badge } from '@/src/ui/Badge';
import { gradientStyle, linear } from '@/src/ui/gradient';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { Text } from '@/src/ui/Text';
import { colors, gradients, radius, shadow, space } from '@/src/ui/theme';

import { ProductVisual } from './ProductVisual';

export function monthly(pkg: Pick<Package, 'price' | 'durationMonths'>) {
  return pkg.durationMonths > 1 ? Math.round(pkg.price / pkg.durationMonths / 250) * 250 : null;
}

/**
 * ProductCard — a package presented as a product: a visual band (the admin's
 * image, or a branded gradient), then name, duration, key benefits and price.
 * The most-requested package gets the featured treatment.
 */
export const PackageCard = memo(function PackageCard({ pkg, context }: { pkg: Package; context?: { upgrade?: string; renew?: string } }) {
  const perMonth = monthly(pkg);
  const featured = pkg.isPopular;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/packages/[slug]', params: { slug: pkg.slug, ...context } })}
      accessibilityRole="button"
      accessibilityLabel={`${pkg.name}، ${pkg.durationLabel}، ${formatPrice(pkg.price)}${featured ? '، الأكثر طلبًا' : ''}`}
      style={({ pressed }) => [styles.card, featured && styles.featured, pressed && styles.pressed]}
      testID={`package-${pkg.slug}`}
    >
      <GradientSurface stops={pkg.serviceType === 'VIP' ? ['#12206E', '#2B2FA8', '#4B4FE0'] : gradients.hero} style={styles.band}>
        {pkg.imageUrl ? <Image source={pkg.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="memory-disk" /> : null}
        {pkg.imageUrl ? <View style={[StyleSheet.absoluteFill, styles.scrim]} /> : null}
        <View style={styles.bandRow}>
          <View style={{ gap: space.xs, flex: 1 }}>
            <View style={styles.badges}>
              <Badge label={pkg.serviceType} tone={pkg.serviceType === 'VIP' ? 'warning' : 'glow'} />
              {featured ? <Badge label="الأكثر طلبًا" tone="success" dot /> : null}
            </View>
            <Text variant="heading" numberOfLines={2} style={styles.name}>
              {pkg.name}
            </Text>
            <Text variant="caption" color={colors.ice} weight="bold">
              {pkg.durationLabel}
            </Text>
          </View>
          {!pkg.imageUrl ? <ProductVisual imageUrl={null} kind="package" serviceType={pkg.serviceType} size={72} /> : null}
        </View>
      </GradientSurface>

      <View style={styles.body}>
        {pkg.features.length ? (
          <View style={styles.features}>
            {pkg.features.slice(0, 3).map((feature) => (
              <View key={feature} style={styles.feature}>
                <Ionicons name="checkmark-circle" size={15} color={colors.active} />
                <Text variant="caption" color={colors.ink2} numberOfLines={1} style={{ flexShrink: 1 }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        ) : pkg.description ? (
          <Text variant="caption" color={colors.ink2} numberOfLines={2}>
            {pkg.description}
          </Text>
        ) : null}

        {pkg.requiresDevice ? (
          <Text variant="caption" color={colors.warning}>
            يتطلب جهاز VIP متوافق (يُضاف سعره للطلب)
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={styles.price}>
              {formatPrice(pkg.price)}
            </Text>
            {perMonth ? (
              <Text variant="caption" color={colors.ink3}>
                ≈ {formatPrice(perMonth)} / شهر
              </Text>
            ) : null}
          </View>
          <View style={[styles.go, featured && styles.goFeatured]}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

/** A VIP device as a compact product row (ordering opens checkout). */
export const DeviceCard = memo(function DeviceCard({ device, onPress }: { device: VipDevice; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${device.name}، ${formatPrice(device.price)}`}
      style={({ pressed }) => [styles.device, pressed && styles.pressed]}
    >
      <ProductVisual imageUrl={device.imageUrl} kind="device" serviceType="VIP" size={60} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" numberOfLines={1}>
          {device.name}
        </Text>
        <Text variant="caption" color={colors.ink3} numberOfLines={2}>
          {device.description}
        </Text>
      </View>
      <Text variant="label">{formatPrice(device.price)}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 33, 89, 0.55)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
    boxShadow: shadow.card,
  },
  featured: { borderColor: 'rgba(108, 196, 255, 0.5)', borderTopColor: 'rgba(203, 233, 253, 0.6)', boxShadow: shadow.glow },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  band: { borderRadius: 0, borderWidth: 0, minHeight: 128, padding: space.lg, justifyContent: 'flex-end' },
  scrim: { ...gradientStyle(linear(180, ['rgba(1, 6, 25, 0.05)', 'rgba(1, 6, 25, 0.75)'])) },
  bandRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  badges: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  name: { fontSize: 19, lineHeight: 27 },
  body: { padding: space.lg, gap: space.md },
  features: { gap: 6 },
  feature: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  price: { fontSize: 22, lineHeight: 30 },
  go: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  goFeatured: { backgroundColor: colors.brand, borderColor: colors.glassEdge, ...gradientStyle(linear(135, gradients.primary)) },
  device: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(10, 33, 89, 0.55)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
  },
});
