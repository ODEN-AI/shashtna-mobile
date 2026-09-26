import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { AccountState, Order, Subscription } from '@/src/api/types';
import { formatDate, pluralDays } from '@/src/lib/format';
import { ACCOUNT_STATE, ORDER_STAGE } from '@/src/lib/status';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { colors, radius, space, toneColor } from '@/src/ui/theme';

import { LinearGradientLike } from './LinearGradientLike';

/** Answers "شنو وضعي الحالي؟" at a glance. */
export function SubscriptionHero({
  state,
  subscription,
  order,
}: {
  state: AccountState;
  subscription: Subscription | null;
  order: Order | null;
}) {
  const meta = ACCOUNT_STATE[state];
  const accent = toneColor[meta.tone];
  const fraction = subscription ? Math.max(0.02, Math.min(1, subscription.remainingFraction)) : 0;

  return (
    <LinearGradientLike accent={accent}>
      <View style={styles.top}>
        <Badge label={meta.title} tone={meta.tone} dot />
        {subscription ? <Badge label={subscription.serviceType} tone="glow" /> : null}
      </View>

      {subscription && (state === 'ACTIVE' || state === 'EXPIRING' || state === 'EXPIRED') ? (
        <>
          <Text variant="title">{subscription.packageName}</Text>
          <View style={styles.daysRow}>
            <Text variant="hero" color={accent}>
              {subscription.state === 'EXPIRED' ? '0' : String(subscription.daysRemaining)}
            </Text>
            <Text color={colors.ink2}>{subscription.state === 'EXPIRED' ? 'منتهي' : `${subscription.daysRemaining >= 3 && subscription.daysRemaining <= 10 ? 'أيام' : 'يوم'} متبقية`}</Text>
          </View>
          <View style={styles.bar} accessibilityLabel={`باقي ${pluralDays(subscription.daysRemaining)}`}>
            <View style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: accent }]} />
          </View>
          <Text variant="caption" color={colors.ink3}>
            ينتهي {formatDate(subscription.expiryDate)}
          </Text>
          <View style={styles.actions}>
            <Button title="التفاصيل" variant="secondary" compact onPress={() => router.push(`/subscriptions/${subscription.id}`)} style={{ flex: 1 }} />
            {subscription.canRenew ? (
              <Button
                title="تجديد"
                icon="refresh"
                compact
                onPress={() => router.push({ pathname: '/packages/[slug]', params: { slug: subscription.packageSlug!, renew: String(subscription.id) } })}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        </>
      ) : state === 'PENDING' && order ? (
        <>
          <Text variant="title">{order.serviceName}</Text>
          <Text color={colors.ink2}>{ORDER_STAGE[order.stage].label}</Text>
          <Button title="متابعة الطلب" icon="arrow-back" onPress={() => router.push(`/orders/${order.id}`)} />
        </>
      ) : (
        <>
          <Text variant="title">ابدأ المشاهدة ويا شاشتنا</Text>
          <Text color={colors.ink2}>اختار باقة، ادفع بالتحويل، وفريقنا يفعّل اشتراكك.</Text>
          <Button title="تصفح الباقات" icon="sparkles" onPress={() => router.push('/packages')} />
        </>
      )}
    </LinearGradientLike>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  daysRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  bar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
});
