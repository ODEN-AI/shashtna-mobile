import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Subscription } from '@/src/api/types';
import { formatDate, pluralDays } from '@/src/lib/format';
import { SUBSCRIPTION_STATE } from '@/src/lib/status';
import { useSubscriptions } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { EmptyState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space, toneColor } from '@/src/ui/theme';

export default function SubscriptionsScreen() {
  const query = useSubscriptions();

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <QueryBoundary query={query}>
        {(subscriptions) =>
          subscriptions.length ? (
            subscriptions.map((subscription) => <SubscriptionCard key={subscription.id} subscription={subscription} />)
          ) : (
            <EmptyState
              icon="tv-outline"
              title="ما عندك اشتراكات بعد"
              body="بعد ما يتفعّل طلبك، يظهر اشتراكك هنا ويا بيانات الدخول."
              action={<Button title="تصفح الباقات" onPress={() => router.push('/packages')} />}
            />
          )
        }
      </QueryBoundary>
    </Screen>
  );
}

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const meta = SUBSCRIPTION_STATE[subscription.state];

  return (
    <Card onPress={() => router.push(`/subscriptions/${subscription.id}`)} accessibilityLabel={`${subscription.packageName}، ${meta.label}`} style={{ gap: space.md }}>
      <View style={styles.row}>
        <Text variant="heading" style={{ flex: 1 }}>
          {subscription.packageName}
        </Text>
        <Badge label={meta.label} tone={meta.tone} dot />
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${Math.max(2, subscription.remainingFraction * 100)}%`, backgroundColor: toneColor[meta.tone] }]} />
      </View>
      <View style={styles.row}>
        <Text variant="caption" color={colors.ink3}>
          {subscription.serviceType} · ينتهي {formatDate(subscription.expiryDate)}
        </Text>
        {subscription.state !== 'EXPIRED' ? (
          <Text variant="caption" color={colors.ink2}>
            باقي {pluralDays(subscription.daysRemaining)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  bar: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.pill },
});
