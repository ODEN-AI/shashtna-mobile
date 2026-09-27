import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { AccountState, Order, Subscription } from '@/src/api/types';
import { formatDate, pluralDays } from '@/src/lib/format';
import { ACCOUNT_STATE, ORDER_STAGE } from '@/src/lib/status';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { gradientStyle, linear } from '@/src/ui/gradient';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { Text } from '@/src/ui/Text';
import { colors, gradients, radius, shadow, space } from '@/src/ui/theme';

const STOPS: Partial<Record<AccountState, readonly string[]>> = {
  EXPIRED: ['#1A1F6E', '#3A1D6E', '#6B2150'],
  EXPIRING: ['#0B2CB1', '#2346D8', '#4B4FE0'],
};

/**
 * The home screen's anchor — "شنو وضع اشتراكي؟" at a glance: package,
 * status, days left, expiry, progress and the renewal action.
 */
export function SubscriptionHero({ state, subscription, order }: { state: AccountState; subscription: Subscription | null; order: Order | null }) {
  const meta = ACCOUNT_STATE[state];
  const showsSubscription = Boolean(subscription) && (state === 'ACTIVE' || state === 'EXPIRING' || state === 'EXPIRED');

  return (
    <GradientSurface stops={STOPS[state] ?? gradients.hero} style={styles.hero} testID="subscription-hero">
      <View pointerEvents="none" style={styles.orbit} />
      <View style={styles.content}>
        <View style={styles.top}>
          <Badge label={meta.title} tone={meta.tone === 'neutral' ? 'brand' : meta.tone} dot />
          {subscription && showsSubscription ? <Badge label={subscription.serviceType} tone="glow" /> : null}
        </View>

        {subscription && showsSubscription ? (
          <Active subscription={subscription} />
        ) : state === 'PENDING' && order ? (
          <>
            <Text variant="caption" color={colors.ice} weight="bold">
              طلبك الحالي
            </Text>
            <Text variant="title" numberOfLines={2}>
              {order.serviceName}
            </Text>
            <View style={styles.pendingRow}>
              <Ionicons name={ORDER_STAGE[order.stage].icon as never} size={18} color={colors.ice} />
              <Text color={colors.ice} style={{ flex: 1 }}>
                {ORDER_STAGE[order.stage].label} — تفاصيل الدفع تحت.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text variant="title">ابدأ المشاهدة ويا شاشتنا</Text>
            <Text color={colors.ice}>اختار باقة، ادفع بالتحويل، وفريقنا يفعّل اشتراكك.</Text>
            <Button title="تصفح الباقات" icon="sparkles" variant="light" onPress={() => router.push('/packages')} style={{ marginTop: space.xs }} />
          </>
        )}
      </View>
    </GradientSurface>
  );
}

function Active({ subscription }: { subscription: Subscription }) {
  const expired = subscription.state === 'EXPIRED';
  const days = expired ? 0 : subscription.daysRemaining;
  const fraction = expired ? 0 : Math.max(0.03, Math.min(1, subscription.remainingFraction));
  const unit = days >= 3 && days <= 10 ? 'أيام متبقية' : 'يوم متبقي';

  return (
    <>
      <View style={{ gap: 2 }}>
        <Text variant="caption" color={colors.ice} weight="bold">
          باقتك
        </Text>
        <Text variant="title" numberOfLines={2}>
          {subscription.packageName}
        </Text>
      </View>

      <View style={styles.daysRow} accessible accessibilityLabel={expired ? 'الاشتراك منتهي' : `باقي ${pluralDays(days)}`}>
        <Text variant="display" style={styles.days}>
          {String(days)}
        </Text>
        <Text color={colors.ice} weight="bold">
          {expired ? 'منتهي' : unit}
        </Text>
      </View>

      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}>
        <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
      </View>
      <Text variant="caption" color={colors.ice}>
        {expired ? `انتهى ${formatDate(subscription.expiryDate)}` : `ينتهي ${formatDate(subscription.expiryDate)}`}
      </Text>

      <View style={styles.actions}>
        <Button title="التفاصيل" variant="glass" compact onPress={() => router.push(`/subscriptions/${subscription.id}`)} style={{ flex: 1 }} />
        {subscription.canRenew ? (
          <Button
            title={expired ? 'جدّد الآن' : 'تجديد'}
            icon="refresh"
            variant="light"
            compact
            onPress={() => router.push({ pathname: '/checkout', params: { renew: String(subscription.id) } })}
            style={{ flex: 1 }}
            testID="hero-renew"
          />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { boxShadow: shadow.glow, borderRadius: radius.xxl },
  orbit: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -120,
    start: -80,
    borderWidth: 1,
    borderColor: 'rgba(203, 233, 253, 0.18)',
  },
  content: { padding: space.xl, gap: space.md },
  top: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  daysRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  days: { fontSize: 52, lineHeight: 60 },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: 'rgba(1, 6, 25, 0.35)', overflow: 'hidden' },
  fill: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.ice,
    boxShadow: '0px 0px 12px rgba(203, 233, 253, 0.8)',
    ...gradientStyle(linear(90, gradients.ice)),
  },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.xs },
});
