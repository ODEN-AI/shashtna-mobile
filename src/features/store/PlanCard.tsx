import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Package, PackageOption } from '@/src/api/types';
import { optionsOf, priceOf } from '@/src/lib/catalog';
import { formatPrice } from '@/src/lib/format';
import { Text } from '@/src/ui/Text';
import { colors, rgba, space } from '@/src/ui/theme';

import { openPackage } from './StoreCards';

const LOGO = require('@/assets/brand/logo.png');

/** The website's plan-board palette (app/components/home/home.module.css), so the store looks like /plans. */
export const site = {
  panel: '#0B1738',
  panel2: '#11214D',
  line: 'rgba(160, 190, 255, 0.12)',
  ink: '#F4F7FF',
  ink2: '#C3CFEE',
  ink3: '#8C9BC7',
  royal: '#1F4FFF',
  sky: '#5CC8FF',
  gold: '#F1CF7A',
  vipTop: '#171A33',
  vipBottom: '#0C0E20',
} as const;

/** «3 أشهر», «سنة», «سنتين»… as the website writes lengths. */
export function lengthLabel(months: number) {
  if (months === 12) return 'سنة';
  if (months === 24) return 'سنتين';
  if (months % 12 === 0) return `${months / 12} سنوات`;
  if (months === 1) return 'شهر';
  if (months === 2) return 'شهرين';
  if (months <= 10) return `${months} أشهر`;
  return `${months} شهر`;
}

/** ≈ price a month, rounded to 250 IQD like the website. */
function monthly(price: number, months: number) {
  return months > 1 ? Math.round(price / months / 250) * 250 : null;
}

/**
 * A package as the website's /plans card: the length in sky blue, the
 * package art (its image, else the brand mark), the name, then the price
 * with its monthly equivalent and a round go button. VIP is warm black and
 * gold. `option` pins one length (from the length filter); without it the
 * card shows the cheapest length "from".
 */
export const PlanCard = memo(function PlanCard({
  pkg,
  option,
  best,
  art,
  deviceFrom,
}: {
  pkg: Package;
  option?: PackageOption | null;
  best?: boolean;
  /** Fallback art (a platform group's logo, or a VIP device photo). */
  art?: string | null;
  deviceFrom?: number | null;
}) {
  const vip = pkg.serviceType === 'VIP';
  const options = optionsOf(pkg);
  const shown = option ?? options[0];
  const several = !option && options.length > 1;
  const price = priceOf(shown);
  const perMonth = monthly(price.now, shown.durationMonths);
  const image = pkg.imageUrl ?? art ?? null;
  const renewal = priceOf(shown, 'RENEW').now;
  const accent = vip ? site.gold : site.sky;

  return (
    <Pressable
      onPress={() => openPackage(pkg, option?.id || undefined)}
      accessibilityRole="button"
      accessibilityLabel={`${pkg.name}، ${several ? 'من ' : ''}${formatPrice(price.now)}`}
      style={({ pressed }) => [styles.card, vip ? styles.cardVip : styles.cardIptv, best && styles.cardBest, pressed && styles.pressed]}
      testID={`package-${pkg.slug}`}
    >
      <Text variant="label" weight="bold" color={accent} style={styles.duration}>
        {several ? `${lengthLabel(options[0].durationMonths)} – ${lengthLabel(options[options.length - 1].durationMonths)}` : lengthLabel(shown.durationMonths)}
      </Text>

      <View style={[styles.art, vip && styles.artVip]}>
        {image ? (
          <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} recyclingKey={`plan-${pkg.id}`} accessibilityIgnoresInvertColors />
        ) : (
          <Image source={LOGO} style={styles.logo} contentFit="contain" />
        )}
        {best ? (
          <View style={[styles.badge, { backgroundColor: site.sky }]}>
            <Text variant="micro" color="#04203A" style={styles.badgeText}>
              الأوفر بالشهر
            </Text>
          </View>
        ) : pkg.isPopular ? (
          <View style={[styles.badge, { backgroundColor: vip ? site.gold : '#FFFFFF' }]}>
            <Text variant="micro" color={vip ? '#2A1D05' : '#0B1738'} style={styles.badgeText}>
              الأكثر طلباً
            </Text>
          </View>
        ) : null}
      </View>

      <Text variant="title" weight="bold" color={site.ink} style={styles.name} numberOfLines={2}>
        {pkg.name}
      </Text>
      {several ? (
        <Text variant="caption" color={site.ink3} style={styles.meta}>
          {options.length} مدد، كل مدة بسعرها
        </Text>
      ) : null}
      {vip && deviceFrom ? (
        <Text variant="caption" color={site.ink3} style={styles.meta}>
          + جهاز من {formatPrice(deviceFrom)}
        </Text>
      ) : null}
      {vip && renewal !== price.now ? (
        <Text variant="caption" color={site.ink3} style={styles.meta}>
          التجديد: {formatPrice(renewal)}
        </Text>
      ) : null}

      <View style={styles.foot}>
        <View style={styles.flex}>
          {price.before ? (
            <View style={styles.dealRow}>
              <View style={styles.deal}>
                <Text variant="micro" color="#FFFFFF">
                  خصم {Math.round(((price.before - price.now) / price.before) * 100)}%
                </Text>
              </View>
              <Text variant="caption" color={site.ink3} style={styles.was}>
                {formatPrice(price.before)}
              </Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            {several ? (
              <Text variant="caption" color={site.ink3}>
                من{' '}
              </Text>
            ) : null}
            <Text color={site.ink} style={styles.price}>
              {new Intl.NumberFormat('en-US').format(price.now)}
            </Text>
            <Text variant="label" color={site.ink3}>
              {' '}د.ع
            </Text>
          </View>
          {perMonth ? (
            <Text variant="caption" color={site.ink3} style={styles.nums}>
              ≈ {formatPrice(perMonth)} بالشهر
            </Text>
          ) : null}
        </View>
        <View style={[styles.go, vip && styles.goVip]} testID={`order-${pkg.slug}`}>
          <MaterialIcons name="arrow-back" size={22} color={vip ? '#2A1D05' : '#FFFFFF'} />
        </View>
      </View>
    </Pressable>
  );
});

/** The website's length filter: «الكل» plus every length on sale, as one pill rail. */
export function LengthTabs({ lengths, value, onChange }: { lengths: number[]; value: number | 'all'; onChange: (value: number | 'all') => void }) {
  const items: (number | 'all')[] = ['all', ...lengths];

  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {items.map((item) => {
        const on = item === value;

        return (
          <Pressable
            key={String(item)}
            onPress={() => onChange(item)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.tab, on && styles.tabOn]}
            testID={`length-tab-${item}`}
          >
            <Text variant="label" weight="bold" color={on ? '#FFFFFF' : site.ink2}>
              {item === 'all' ? 'الكل' : lengthLabel(item)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  nums: { fontVariant: ['tabular-nums'] },
  card: { padding: 18, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: site.line },
  cardIptv: { experimental_backgroundImage: `linear-gradient(180deg, ${site.panel2}, ${site.panel})`, backgroundColor: site.panel },
  cardVip: { experimental_backgroundImage: `linear-gradient(180deg, ${site.vipTop}, ${site.vipBottom})`, backgroundColor: site.vipBottom, borderColor: 'rgba(241, 207, 122, 0.16)' },
  cardBest: { borderWidth: 2, borderColor: site.sky, boxShadow: '0px 20px 40px -20px rgba(92, 200, 255, 0.6)' },
  pressed: { transform: [{ scale: 0.98 }] },
  duration: { fontSize: 15, marginBottom: space.md },
  art: { height: 150, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: rgba(site.royal, 0.18) },
  artVip: { backgroundColor: '#EAF2FF' },
  logo: { width: 96, height: 96 },
  badge: { position: 'absolute', top: 12, start: 12, height: 30, paddingHorizontal: 12, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 13, lineHeight: 18 },
  name: { fontSize: 21, lineHeight: 30, marginTop: space.lg },
  meta: { marginTop: 4, fontSize: 14 },
  foot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md, paddingTop: 20 },
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 6 },
  deal: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.dangerStrong },
  was: { textDecorationLine: 'line-through' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 30, lineHeight: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
  go: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: site.royal, boxShadow: '0px 10px 24px -10px rgba(31, 79, 255, 0.9)' },
  goVip: { backgroundColor: '#D9AD4F', experimental_backgroundImage: 'linear-gradient(135deg, #F6DC95, #D9AD4F)', boxShadow: '0px 10px 24px -10px rgba(241, 207, 122, 0.8)' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start', gap: 6, padding: 6, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: site.line },
  tab: { height: 44, paddingHorizontal: 18, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: site.royal, boxShadow: '0px 8px 20px -8px rgba(31, 79, 255, 0.8)' },
});
