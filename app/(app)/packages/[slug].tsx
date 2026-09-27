import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RequestType } from '@/src/api/types';
import { useRequireAuth } from '@/src/auth/useRequireAuth';
import { monthly } from '@/src/features/PackageCard';
import { ProductVisual } from '@/src/features/ProductVisual';
import { formatPrice } from '@/src/lib/format';
import { useCatalog } from '@/src/query/hooks';
import { AmbientBackground } from '@/src/ui/AmbientBackground';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { gradientStyle, linear } from '@/src/ui/gradient';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, gradients, hitSlop, radius, shadow, space } from '@/src/ui/theme';

const TYPE_TITLE: Record<RequestType, string> = {
  NEW: 'اشتراك جديد',
  RENEW: 'تجديد الاشتراك',
  UPGRADE: 'ترقية الاشتراك',
  DEVICE_PURCHASE: 'شراء جهاز',
};

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Package as a premium product: hero visual, a glass information layer,
 * key facts, benefits, and one primary action. Guests can read everything;
 * ordering asks them to sign in and continues to checkout afterwards.
 */
export default function PackageScreen() {
  const params = useLocalSearchParams<{ slug: string; renew?: string; upgrade?: string }>();
  const catalog = useCatalog();
  const { go } = useRequireAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const pkg = catalog.data?.packages.find((item) => item.slug === params.slug);
  const requestType: RequestType = params.renew ? 'RENEW' : params.upgrade ? 'UPGRADE' : 'NEW';
  const heroHeight = Math.min(360, Math.max(250, height * 0.38));

  function order() {
    if (!pkg) return;
    go({
      pathname: '/checkout',
      params: { plan: pkg.slug, ...(params.renew ? { renew: params.renew } : {}), ...(params.upgrade ? { upgrade: params.upgrade } : {}) },
    });
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace('/packages'));
  const perMonth = pkg ? monthly(pkg) : null;

  const facts: { icon: IconName; label: string; value: string }[] = pkg
    ? [
        { icon: 'calendar-outline', label: 'المدة', value: pkg.durationLabel },
        { icon: pkg.serviceType === 'VIP' ? 'diamond-outline' : 'tv-outline', label: 'الخدمة', value: pkg.serviceType },
        ...(perMonth ? [{ icon: 'wallet-outline' as IconName, label: 'شهريًا', value: `≈ ${formatPrice(perMonth)}` }] : []),
        ...(pkg.requiresDevice ? [{ icon: 'hardware-chip-outline' as IconName, label: 'الجهاز', value: 'VIP متوافق' }] : []),
      ]
    : [];

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={catalog.isRefetching} onRefresh={() => void catalog.refetch()} tintColor={colors.brandInk} colors={[colors.brand]} />}
      >
        <GradientSurface stops={pkg?.serviceType === 'VIP' ? ['#12206E', '#2B2FA8', '#4B4FE0'] : gradients.hero} style={[styles.hero, { height: heroHeight + insets.top }]}>
          {pkg?.imageUrl ? (
            <>
              <Image source={pkg.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} cachePolicy="memory-disk" />
              <View style={[StyleSheet.absoluteFill, styles.scrim]} />
            </>
          ) : (
            <View style={[styles.heroArt, { paddingTop: insets.top }]}>
              <View style={styles.halo} />
              <ProductVisual imageUrl={null} kind="package" serviceType={pkg?.serviceType ?? 'IPTV'} size={Math.round(heroHeight * 0.46)} floating />
            </View>
          )}
        </GradientSurface>

        <View style={styles.sheet}>
          {pkg ? (
            <>
              <View style={styles.badges}>
                <Badge label={pkg.serviceType} tone={pkg.serviceType === 'VIP' ? 'warning' : 'glow'} />
                {requestType !== 'NEW' ? <Badge label={TYPE_TITLE[requestType]} tone="info" /> : null}
                {pkg.isPopular ? <Badge label="الأكثر طلبًا" tone="success" dot /> : null}
              </View>
              <Text variant="title" accessibilityRole="header">
                {pkg.name}
              </Text>
              {pkg.description ? <Text color={colors.ink2}>{pkg.description}</Text> : null}

              <View style={styles.facts}>
                {facts.map((fact) => (
                  <View key={fact.label} style={styles.fact} accessible accessibilityLabel={`${fact.label}: ${fact.value}`}>
                    <Ionicons name={fact.icon} size={20} color={colors.brandInk} />
                    <Text variant="caption" color={colors.ink3}>
                      {fact.label}
                    </Text>
                    <Text variant="label" center numberOfLines={2}>
                      {fact.value}
                    </Text>
                  </View>
                ))}
              </View>

              {pkg.features.length ? (
                <View style={{ gap: space.md }}>
                  <Text variant="heading">شنو تحصل</Text>
                  {pkg.features.map((feature) => (
                    <View key={feature} style={styles.feature}>
                      <View style={styles.check}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                      <Text style={{ flex: 1 }}>{feature}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {pkg.notes ? (
                <Text variant="caption" color={colors.ink3}>
                  {pkg.notes}
                </Text>
              ) : null}

              {pkg.requiresDevice ? <Notice tone="info">باقات VIP تكون ويا جهاز VIP متوافق — تختاره بخطوة تأكيد الطلب.</Notice> : null}
            </>
          ) : catalog.isPending ? (
            <LoadingState rows={2} />
          ) : catalog.isError && !catalog.data ? (
            <ErrorState error={catalog.error} onRetry={() => void catalog.refetch()} />
          ) : (
            <EmptyState
              icon="alert-circle-outline"
              tone="warning"
              title="هذه الباقة غير متاحة حاليًا"
              body="ممكن الإدارة أوقفتها أو غيّرتها. شوف الباقات المتاحة."
              action={<Button title="الباقات المتاحة" onPress={() => router.replace('/packages')} />}
            />
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <OfflineBanner />
        <Pressable onPress={close} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="رجوع" style={styles.back}>
          <Ionicons name="arrow-forward" size={22} color={colors.ink} />
        </Pressable>
      </SafeAreaView>

      {pkg ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) + space.sm }]}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.ink3}>
              السعر
            </Text>
            <Text variant="title" style={{ fontSize: 22, lineHeight: 30 }} numberOfLines={1}>
              {formatPrice(pkg.price)}
            </Text>
          </View>
          <Button
            title={requestType === 'RENEW' ? 'جدّد بهذه الباقة' : requestType === 'UPGRADE' ? 'رقِّ لهذه الباقة' : 'اطلب الباقة'}
            icon="cart"
            onPress={order}
            testID="order-package"
            style={{ flex: 1.3 }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  hero: { borderRadius: 0, borderWidth: 0, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  scrim: { ...gradientStyle(linear(180, ['rgba(1, 6, 25, 0.35)', 'rgba(1, 6, 25, 0)', 'rgba(2, 11, 38, 0.65)'])) },
  heroArt: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: 'rgba(203, 233, 253, 0.2)' },
  sheet: {
    marginTop: -44,
    marginHorizontal: space.lg,
    padding: space.xl,
    gap: space.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(8, 26, 76, 0.9)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
    boxShadow: shadow.float,
    ...gradientStyle(linear(180, gradients.glassSheen)),
  },
  badges: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  facts: { flexDirection: 'row', gap: space.sm },
  fact: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(1, 6, 25, 0.3)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  feature: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.active },
  topBar: { position: 'absolute', top: 0, start: 0, end: 0, paddingHorizontal: space.lg },
  back: {
    marginTop: space.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(1, 6, 25, 0.45)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: 'rgba(3, 14, 46, 0.97)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderBottomWidth: 0,
    boxShadow: shadow.float,
  },
});
