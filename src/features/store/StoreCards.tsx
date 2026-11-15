import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Package, PlanGroup, VipDevice } from '@/src/api/types';
import { optionsOf, priceOf } from '@/src/lib/catalog';
import { formatPrice } from '@/src/lib/format';
import { Button } from '@/src/ui/Button';
import { Panel, Pill, Tile, type MIcon } from '@/src/ui/Kit';
import { Text } from '@/src/ui/Text';
import { colors, radius, rgba, space } from '@/src/ui/theme';

/** Opens the package sheet (lengths, features, total) with a length already chosen. */
export function openPackage(pkg: Package, optionId?: number, renew?: string) {
  router.push({
    pathname: '/packages/[slug]',
    params: { slug: pkg.slug, ...(optionId ? { option: String(optionId) } : {}), ...(renew ? { renew } : {}) },
  });
}

/** Points an IPTV order of this price earns (the server's rule: 1 per 1,000 IQD, or the option's own number). */
export function pointsFor(price: number, override: number | null, serviceType: string) {
  if (serviceType === 'VIP') return null;
  return override ?? Math.floor(price / (serviceType === 'DIGITAL' ? 5000 : 1000));
}

/** Store section header: icon, title and the group's own description. */
export function SectionHeader({ icon, title, body, color = colors.brandInk }: { icon: MIcon; title: string; body?: string | null; color?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.row}>
        <MaterialIcons name={icon} size={24} color={color} />
        <Text variant="heading" weight="bold" color={color === colors.amber ? colors.amber : colors.ink} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {body ? (
        <Text variant="caption" color={colors.ink2}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

/** An IPTV package (Stitch "Star10" card): lengths as a segmented choice, new and renewal prices, one action. */
export function PlanCard({ pkg, showPoints, badge }: { pkg: Package; showPoints: boolean; badge?: string }) {
  const options = optionsOf(pkg);
  const [selected, setSelected] = useState(options[0]?.id);
  const option = options.find((item) => item.id === selected) ?? options[0];
  const price = priceOf(option);
  const renewal = priceOf(option, 'RENEW');
  const points = showPoints ? pointsFor(price.now, option.pointsEarned, pkg.serviceType) : null;

  return (
    <Panel style={styles.plan} testID={`package-${pkg.slug}`}>
      {badge ? <Pill label={badge} color="#E1F2FF" background="#00759F" style={styles.floatingBadge} /> : null}
      <View style={styles.between}>
        <View style={styles.flex}>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            <Text variant="heading" weight="bold" style={{ fontSize: 20 }}>
              {pkg.name}
            </Text>
            {points ? <Pill label={`تكسب ${points} نقطة`} icon="military-tech" color={colors.amber} background={rgba(colors.amberDeep, 0.2)} /> : null}
          </View>
          {pkg.description ? (
            <Text variant="caption" color={colors.ink2} numberOfLines={2}>
              {pkg.description}
            </Text>
          ) : null}
        </View>
        <Tile icon="live-tv" background={colors.surface2} />
      </View>

      {options.length > 1 ? (
        <View style={{ gap: 6 }}>
          <Text variant="micro" color={colors.ink3}>
            اختر مدة الاشتراك:
          </Text>
          <View style={styles.lengths} accessibilityRole="radiogroup">
            {options.map((item) => {
              const on = item.id === option.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelected(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[styles.length, on && styles.lengthOn]}
                  testID={`length-${pkg.slug}-${item.durationMonths}`}
                >
                  <Text variant="micro" color={on ? colors.onBrand : colors.ink2} style={{ fontSize: 12 }} center>
                    {item.durationLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.priceBox}>
        <View>
          <Text variant="micro" color={colors.ink2}>
            {options.length > 1 ? 'سعر الاشتراك الجديد' : `سعر ${option.durationLabel}`}
          </Text>
          <View style={styles.row}>
            <Text variant="heading" weight="bold" color={colors.brandInk} style={styles.nums}>
              {formatPrice(price.now)}
            </Text>
            {price.before ? (
              <Text variant="caption" color={colors.ink3} style={styles.strike}>
                {formatPrice(price.before)}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.end}>
          <Text variant="micro" color={colors.ink2}>
            سعر التجديد لاحقاً
          </Text>
          <Text variant="label" weight="semibold" color={colors.ink2} style={[styles.nums, { fontSize: 16 }]}>
            {formatPrice(renewal.now)}
          </Text>
        </View>
      </View>

      <Button title="اطلب هسه" iconEnd="arrow-back" onPress={() => openPackage(pkg, option.id || undefined)} testID={`order-${pkg.slug}`} />
    </Panel>
  );
}

/** A VIP package (Stitch obsidian and gold card): always 3 months, sold with a compatible device. */
export function VipCard({ pkg, devices }: { pkg: Package; devices: VipDevice[] }) {
  const option = optionsOf(pkg)[0];
  const price = priceOf(option);
  const renewal = priceOf(option, 'RENEW');
  const compatible = devices.filter((device) => device.packageIds.includes(pkg.id));
  const cheapestDevice = compatible.length ? Math.min(...compatible.map((device) => device.price)) : null;

  return (
    <Panel tone="vip" style={styles.plan} testID={`package-${pkg.slug}`}>
      <View style={styles.between}>
        <View style={styles.flex}>
          <Text variant="heading" weight="bold" color={colors.goldLight} style={{ fontSize: 20 }}>
            {pkg.name}
          </Text>
          {pkg.description ? (
            <Text variant="caption" color={colors.ink2} numberOfLines={3}>
              {pkg.description}
            </Text>
          ) : null}
        </View>
        <Tile icon="workspace-premium" color={colors.gold} />
      </View>
      <View style={styles.row}>
        <Pill label={option.durationLabel} color={colors.gold} background={rgba(colors.gold, 0.12)} />
        {cheapestDevice !== null ? <Pill label={`+ جهاز من ${formatPrice(cheapestDevice)}`} color={colors.ink2} background={colors.surface2} /> : null}
      </View>
      <View style={[styles.priceBox, { backgroundColor: '#1A1C23' }]}>
        <View>
          <Text variant="micro" color={colors.ink2}>
            سعر الباقة
          </Text>
          <Text variant="heading" weight="bold" color={colors.goldLight} style={styles.nums}>
            {formatPrice(price.now)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.end}>
          <Text variant="micro" color={colors.ink2}>
            التجديد
          </Text>
          <Text variant="label" weight="semibold" color={colors.ink2} style={[styles.nums, { fontSize: 16 }]}>
            {formatPrice(renewal.now)}
          </Text>
        </View>
      </View>
      <Button title="اطلب الباقة والجهاز" variant="vip" icon="cart-outline" onPress={() => openPackage(pkg)} testID={`order-${pkg.slug}`} />
    </Panel>
  );
}

const DELIVERY: Record<string, { label: string; icon: MIcon }> = {
  CODE: { label: 'كود فوري', icon: 'vpn-key' },
  ACCOUNT: { label: 'حساب جاهز', icon: 'person' },
  CUSTOMER_EMAIL: { label: 'على حسابك', icon: 'alternate-email' },
};

/** A digital platform package (Stitch platform row): delivery chip, the cheapest length, one action. */
export function PlatformRow({ pkg, group }: { pkg: Package; group: PlanGroup | undefined }) {
  const options = optionsOf(pkg);
  const option = options[0];
  const price = priceOf(option);
  const delivery = group ? DELIVERY[group.delivery] : undefined;
  const accent = group?.accent ?? colors.brand;

  return (
    <Panel onPress={() => openPackage(pkg)} accessibilityLabel={pkg.name} style={styles.platform} testID={`package-${pkg.slug}`}>
      <View style={[styles.platformLogo, { backgroundColor: rgba(accent.startsWith('#') && accent.length === 7 ? accent : colors.brand, 0.18) }]}>
        <Text variant="label" weight="bold" color={colors.ink}>
          {(group?.name ?? pkg.name).trim().charAt(0)}
        </Text>
      </View>
      <View style={styles.flex}>
        <Text variant="label" weight="bold" numberOfLines={1} style={{ fontSize: 16 }}>
          {pkg.name}
        </Text>
        <Text variant="caption" color={colors.ink2} numberOfLines={1}>
          {options.length > 1 ? `من ${option.durationLabel}` : option.durationLabel}
          {pkg.description ? ` · ${pkg.description}` : ''}
        </Text>
        {delivery ? <Pill label={delivery.label} icon={delivery.icon} color={colors.sky} background={rgba(colors.sky, 0.1)} style={{ marginTop: 4 }} /> : null}
      </View>
      <View style={styles.end}>
        <Text variant="label" weight="bold" style={[styles.nums, { fontSize: 16 }]}>
          {formatPrice(price.now)}
        </Text>
        <View style={styles.buy}>
          <Text variant="micro" color={colors.onBrand}>
            شراء
          </Text>
        </View>
      </View>
    </Panel>
  );
}

/** Store hero: the biggest discount on sale right now (real, from the catalogue), else nothing. */
export function DiscountHero({ packages }: { packages: Package[] }) {
  const best = packages
    .flatMap((pkg) => optionsOf(pkg).map((option) => ({ pkg, option, price: priceOf(option) })))
    .filter((item) => item.price.before !== null)
    .sort((a, b) => (b.price.before! - b.price.now) / b.price.before! - (a.price.before! - a.price.now) / a.price.before!)[0];

  if (!best) return null;

  const percent = Math.round(((best.price.before! - best.price.now) / best.price.before!) * 100);
  const vip = best.pkg.serviceType === 'VIP';
  const ends = best.option.discount?.endsInDays;

  return (
    <View style={styles.hero} testID="discount-hero">
      <View style={[styles.heroGlow]} pointerEvents="none" />
      <View style={styles.between}>
        <View style={[styles.flex, { gap: space.xs }]}>
          <Pill label={`خصم ${percent}%${ends !== null && ends !== undefined ? ` · ينتهي خلال ${ends} يوم` : ''}`} dot={colors.dangerStrong} color="#FF8A7A" background={rgba(colors.dangerStrong, 0.15)} />
          <Text variant="title" weight="bold">
            {best.pkg.name}
          </Text>
          <Text variant="label" color={vip ? colors.goldLight : colors.sky}>
            {best.option.durationLabel}
          </Text>
          <View style={styles.row}>
            <Text variant="title" weight="bold" style={styles.nums}>
              {formatPrice(best.price.now)}
            </Text>
            <Text variant="caption" color={colors.ink3} style={styles.strike}>
              {formatPrice(best.price.before!)}
            </Text>
          </View>
        </View>
        <View style={styles.heroIcon}>
          <MaterialIcons name={vip ? 'workspace-premium' : 'live-tv'} size={56} color={colors.onBrand} />
        </View>
      </View>
      <Button title="اطلب هسه" variant="light" onPress={() => openPackage(best.pkg, best.option.id || undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md },
  end: { alignItems: 'flex-end' },
  nums: { fontVariant: ['tabular-nums'] },
  strike: { textDecorationLine: 'line-through' },
  plan: { gap: space.lg },
  floatingBadge: { position: 'absolute', top: -10, end: space.lg },
  lengths: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  length: { flexGrow: 1, flexBasis: '28%', minHeight: 40, paddingHorizontal: space.sm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  lengthOn: { backgroundColor: colors.brand },
  priceBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.sm, paddingHorizontal: space.md, borderRadius: radius.sm, backgroundColor: colors.canvasDeep },
  divider: { width: 1, height: 32, backgroundColor: rgba(colors.lineStrong, 0.4) },
  platform: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  platformLogo: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  buy: { marginTop: 6, paddingHorizontal: space.lg, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.brand },
  hero: { gap: space.lg, padding: space.xl, borderRadius: 28, backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.surface3, overflow: 'hidden' },
  heroGlow: { position: 'absolute', bottom: -60, start: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: rgba('#B45309', 0.18) },
  heroIcon: { width: 112, height: 112, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand, boxShadow: '0px 0px 20px rgba(37, 99, 235, 0.35)' },
});
