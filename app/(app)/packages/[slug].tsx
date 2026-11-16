import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PackageOption } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { useRequireAuth } from '@/src/auth/useRequireAuth';
import { pointsFor } from '@/src/features/store/StoreCards';
import { optionsOf, perMonth, priceOf, type Mode } from '@/src/lib/catalog';
import { formatPrice } from '@/src/lib/format';
import { useCatalog, useHelp, useLoyalty } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Panel, Pill, Tile } from '@/src/ui/Kit';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, rgba, space } from '@/src/ui/theme';

/**
 * Package sheet (Stitch package details): choose the length, see what each
 * costs now and on renewal, the points it earns, what the package includes,
 * and the total. Guests can read everything; ordering asks them to sign in
 * and continues to checkout with the chosen length. The server prices it again.
 */
export default function PackageScreen() {
  const params = useLocalSearchParams<{ slug: string; option?: string; renew?: string; upgrade?: string }>();
  const catalog = useCatalog();
  const { status } = useAuth();
  const loyalty = useLoyalty(status === 'signedIn');
  const help = useHelp();
  const { go } = useRequireAuth();
  const insets = useSafeAreaInsets();
  const pkg = catalog.data?.packages.find((item) => item.slug === params.slug);
  const mode: Mode = params.renew ? 'RENEW' : 'NEW';
  const options = pkg ? optionsOf(pkg) : [];
  const [chosen, setChosen] = useState<number | null>(Number(params.option) || null);
  const option = options.find((item) => item.id === chosen) ?? options[0];
  const price = option ? priceOf(option, mode) : null;
  const vip = pkg?.serviceType === 'VIP';
  const points = pkg && option && price && loyalty.data?.enabled && mode !== 'RENEW' ? pointsFor(price.now, option.pointsEarned, pkg.serviceType) : null;
  const bestValue = bestPerMonth(options, mode);
  // VIP without its own image shows a compatible device; a platform shows its group's logo.
  const art =
    pkg && !pkg.imageUrl
      ? vip
        ? (catalog.data?.devices.find((device) => device.packageIds.includes(pkg.id) && device.imageUrl)?.imageUrl ?? null)
        : (catalog.data?.groups?.find((group) => group.id === pkg.groupId)?.logoUrl ?? null)
      : null;
  const whatsapp = help.data?.support.whatsapp;
  const hours = help.data?.support.hours;

  function order() {
    if (!pkg) return;
    go({
      pathname: '/checkout',
      params: {
        plan: pkg.slug,
        ...(option?.id ? { option: String(option.id) } : {}),
        ...(params.renew ? { renew: params.renew } : {}),
        ...(params.upgrade ? { upgrade: params.upgrade } : {}),
      },
    });
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace('/packages'));

  return (
    <View style={styles.root}>
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <OfflineBanner />
        <View style={styles.between}>
          <Pressable onPress={close} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="إغلاق" style={styles.close} testID="package-close">
            <MaterialIcons name="close" size={22} color={colors.ink} />
          </Pressable>
          <View style={styles.row}>
            {mode === 'RENEW' ? <Pill label="تجديد" icon="autorenew" color={colors.sky} background={colors.surface2} /> : null}
            {params.upgrade ? <Pill label="ترقية" icon="trending-up" color={colors.sky} background={colors.surface2} /> : null}
            {pkg?.isPopular ? <Pill label="الأكثر طلباً" icon="local-fire-department" color={colors.amber} background={rgba(colors.amberDeep, 0.2)} /> : null}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={catalog.isRefetching} onRefresh={() => void catalog.refetch()} tintColor={colors.brandInk} colors={[colors.brand]} />}
      >
        {pkg && option && price ? (
          <>
            {pkg.imageUrl || art ? (
              <View style={[styles.cover, vip && { backgroundColor: '#EAF2FF' }]}>
                <Image source={pkg.imageUrl ?? art!} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              </View>
            ) : null}
            <View style={[styles.head, vip && styles.headVip]}>
              <View style={[styles.row, { alignItems: 'flex-start' }]}>
                <View style={[styles.headIcon, vip && { backgroundColor: '#121316', borderWidth: 1, borderColor: colors.gold }]}>
                  <MaterialIcons name={vip ? 'workspace-premium' : pkg.serviceType === 'DIGITAL' ? 'redeem' : 'live-tv'} size={32} color={vip ? colors.gold : colors.onBrand} />
                </View>
                <View style={styles.flex}>
                  <Text variant="hero" weight="bold" color={vip ? colors.goldLight : colors.ink} accessibilityRole="header">
                    {pkg.name}
                  </Text>
                  {pkg.description ? (
                    <Text variant="caption" color={colors.ink2}>
                      {pkg.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              {vip ? <Pill label="VIP Tier" color={colors.goldLight} background="#121316" style={styles.vipTier} /> : null}
            </View>

            {options.length > 1 ? (
              <View style={styles.section}>
                <View style={styles.between}>
                  <Text variant="heading" weight="bold">
                    اختر مدة الاشتراك
                  </Text>
                  {options.some((item) => priceOf(item, mode).before) ? (
                    <Text variant="micro" color={colors.sky}>
                      سعر بخصم حالي
                    </Text>
                  ) : null}
                </View>
                <View style={styles.grid} accessibilityRole="radiogroup">
                  {options.map((item) => (
                    <LengthCard key={item.id} option={item} mode={mode} selected={item.id === option.id} best={item.id === bestValue} onPress={() => setChosen(item.id)} />
                  ))}
                </View>
              </View>
            ) : (
              <Panel style={styles.single}>
                <Text variant="caption" color={colors.ink2}>
                  المدة
                </Text>
                <Text variant="label" weight="bold" style={{ fontSize: 16 }}>
                  {option.durationLabel}
                </Text>
              </Panel>
            )}

            {points ? (
              <View style={styles.reward} testID="package-points">
                <Tile icon="card-giftcard" color={colors.amber} size={44} background={rgba(colors.amber, 0.15)} />
                <View style={styles.flex}>
                  <View style={styles.row}>
                    <Text variant="label" weight="bold" color={colors.amber}>
                      مكافأة شاشتنا
                    </Text>
                    <Pill label={`+${points} نقطة`} color={colors.onAmber} background={colors.amber} />
                  </View>
                  <Text variant="caption" color={colors.ink2}>
                    تنضاف لرصيدك بعد التفعيل، وتكدر تستبدلها باشتراك مجاني لاحقاً.
                  </Text>
                </View>
              </View>
            ) : null}

            {pkg.features.length ? (
              <View style={styles.section}>
                <Text variant="heading" weight="bold">
                  محتويات ومميزات الباقة
                </Text>
                {pkg.features.map((feature) => (
                  <Panel key={feature} style={styles.feature}>
                    <Tile icon="check-circle" color={colors.sky} size={36} />
                    <Text variant="body" style={styles.flex}>
                      {feature}
                    </Text>
                  </Panel>
                ))}
              </View>
            ) : null}

            {pkg.notes ? (
              <Text variant="caption" color={colors.ink3}>
                {pkg.notes}
              </Text>
            ) : null}

            {pkg.requiresDevice && mode !== 'RENEW' ? <Notice tone="info">باقات VIP تكون ويا جهاز VIP متوافق، تختاره بخطوة تأكيد الطلب.</Notice> : null}

            {whatsapp ? (
              <Panel style={styles.human}>
                <Tile icon="support-agent" color={colors.success} size={44} />
                <View style={styles.flex}>
                  <Text variant="label" weight="semibold">
                    دعم بشري مباشر عبر الواتساب
                  </Text>
                  {hours ? (
                    <Text variant="caption" color={colors.ink2}>
                      {hours}
                    </Text>
                  ) : null}
                </View>
              </Panel>
            ) : null}
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
      </ScrollView>

      {pkg && price ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) + space.sm }]}>
          <View>
            <Text variant="micro" color={colors.ink2}>
              {vip && mode !== 'RENEW' ? 'سعر الباقة (الجهاز بالخطوة الجاية)' : 'المبلغ الإجمالي'}
            </Text>
            <Text variant="hero" weight="bold" style={styles.nums} numberOfLines={1} testID="package-total">
              {formatPrice(price.now)}
            </Text>
          </View>
          <Button
            title={mode === 'RENEW' ? 'متابعة التجديد والدفع' : 'متابعة الطلب والدفع'}
            iconEnd="arrow-back"
            onPress={order}
            testID="order-package"
            style={styles.flex}
          />
        </View>
      ) : null}
    </View>
  );
}

/** The length with the lowest monthly cost (only worth marking when there are several). */
function bestPerMonth(options: PackageOption[], mode: Mode) {
  if (options.length < 2) return null;
  const scored = options.map((option) => ({ id: option.id, value: priceOf(option, mode).now / Math.max(1, option.durationMonths) }));
  return scored.sort((a, b) => a.value - b.value)[0].id;
}

function LengthCard({ option, mode, selected, best, onPress }: { option: PackageOption; mode: Mode; selected: boolean; best: boolean; onPress: () => void }) {
  const price = priceOf(option, mode);
  const renewal = priceOf(option, 'RENEW');
  const monthly = perMonth(price.now, option.durationMonths);
  const saved = price.before ? price.before - price.now : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${option.durationLabel}، ${formatPrice(price.now)}`}
      style={[styles.length, selected && styles.lengthOn]}
      testID={`option-${option.durationMonths}`}
    >
      {best ? (
        <View style={styles.bestTag}>
          <MaterialIcons name="stars" size={12} color={colors.onBrand} />
          <Text variant="micro" color={colors.onBrand}>
            الأوفر
          </Text>
        </View>
      ) : null}
      <View style={styles.between}>
        <Text variant="label" color={selected ? colors.brandInk : colors.ink}>
          {option.durationLabel}
        </Text>
        {selected ? <MaterialIcons name="check-circle" size={20} color={colors.brandInk} /> : saved ? <Pill label={`وفّر ${formatPrice(saved)}`} color={colors.amber} background={rgba(colors.amberDeep, 0.2)} /> : null}
      </View>
      <Text variant="title" weight="bold" style={styles.nums}>
        {formatPrice(price.now)}
      </Text>
      <Text variant="micro" color={colors.ink3}>
        {mode === 'NEW' && renewal.now !== price.now ? `تجديد بـ ${formatPrice(renewal.now)}` : monthly ? `≈ ${formatPrice(monthly)} بالشهر` : ' '}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  top: { paddingHorizontal: space.lg, paddingBottom: space.sm, backgroundColor: colors.canvas },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  content: { paddingHorizontal: space.lg, gap: space.xl },
  cover: { height: 190, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface2 },
  head: { gap: space.md, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.surface2, overflow: 'hidden' },
  headVip: { backgroundColor: '#1A1C23', borderWidth: 1, borderColor: rgba(colors.gold, 0.35) },
  headIcon: { width: 64, height: 64, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  vipTier: { paddingVertical: 4, borderWidth: 1, borderColor: rgba(colors.gold, 0.5) },
  section: { gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  single: { gap: 2 },
  length: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: 4,
    padding: space.md,
    paddingTop: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  lengthOn: { backgroundColor: colors.surface2, borderColor: colors.brand },
  bestTag: { position: 'absolute', top: -10, start: space.md, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.brand },
  reward: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.amberDeep, backgroundColor: rgba(colors.amberDeep, 0.06) },
  feature: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  human: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingTop: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0px -20px 40px rgba(0, 0, 0, 0.5)',
  },
});
