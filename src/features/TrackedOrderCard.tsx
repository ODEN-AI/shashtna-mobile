import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { OrderDetail } from '@/src/api/types';
import { formatPrice } from '@/src/lib/format';
import { ORDER_STAGE } from '@/src/lib/status';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { Journey } from '@/src/ui/Journey';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

import { OrderPaymentFlow } from './OrderPayment';

/**
 * «طلب قيد المتابعة» — the dashboard's order card, as on the website: the
 * journey plus the payment flow (transfer details and proof upload, or the
 * review / paid state) right on the home screen.
 */
export function TrackedOrderCard({ order }: { order: OrderDetail }) {
  const meta = ORDER_STAGE[order.stage];

  return (
    <View style={{ gap: space.md }} testID="tracked-order">
      <Card style={{ gap: space.md }}>
        <View style={styles.row}>
          <Text variant="heading">طلب قيد المتابعة</Text>
          <Badge label={meta.label} tone={meta.tone} dot />
        </View>
        <View style={styles.row}>
          <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
            {order.serviceName}
            {order.deviceName ? ` + ${order.deviceName}` : ''}
          </Text>
          <Text variant="label">{formatPrice(order.price)}</Text>
        </View>
        <Text variant="caption" color={colors.ink3}>
          {order.number} · {order.requestTypeLabel}
        </Text>
        {order.stage !== 'CANCELLED' && order.stage !== 'REJECTED' ? <Journey steps={order.journey} /> : null}
      </Card>

      <OrderPaymentFlow order={order} />

      <Button title="تفاصيل الطلب" variant="ghost" compact onPress={() => router.push(`/orders/${order.id}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
});
