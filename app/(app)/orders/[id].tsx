import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/src/api/client';
import type { OrderDetail } from '@/src/api/types';
import { OrderPaymentFlow } from '@/src/features/OrderPayment';
import { formatDateTime, formatPrice } from '@/src/lib/format';
import { ORDER_STAGE } from '@/src/lib/status';
import { useCancelOrder, useOrder } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { IconWell } from '@/src/ui/IconWell';
import { Journey } from '@/src/ui/Journey';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, space } from '@/src/ui/theme';

/**
 * Order journey and manual payment — the same flow as the website's order
 * panel: amount → transfer to the number shown → upload the proof (plus the
 * transaction reference) → staff review → activation.
 */
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const query = useOrder(orderId);

  return (
    <>
      <Stack.Screen options={{ title: query.data?.number ?? 'تفاصيل الطلب' }} />
      <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        <QueryBoundary query={query} rows={3}>
          {(order) => <OrderBody order={order} />}
        </QueryBoundary>
      </Screen>
    </>
  );
}

function OrderBody({ order }: { order: OrderDetail }) {
  const meta = ORDER_STAGE[order.stage];
  const cancel = useCancelOrder(order.id);
  const toast = useToast();

  return (
    <>
      <Card style={{ gap: space.md }}>
        <View style={styles.headerRow}>
          <IconWell name={meta.icon as never} tone={meta.tone} />
          <View style={{ flex: 1, gap: 4 }}>
            <Badge label={meta.label} tone={meta.tone} dot />
            <Text variant="heading">{order.serviceName}</Text>
          </View>
        </View>
        <Text color={colors.ink2}>{order.statusHint}</Text>
        {order.stage !== 'CANCELLED' && order.stage !== 'REJECTED' ? <Journey steps={order.journey} /> : null}
      </Card>

      <OrderPaymentFlow order={order} />

      {order.stage === 'ACTIVATED' && order.subscriptionId ? (
        <Button title="افتح الاشتراك" icon="tv-outline" onPress={() => router.push(`/subscriptions/${order.subscriptionId}`)} />
      ) : null}

      <Card style={{ gap: space.md }}>
        <Text variant="heading">تفاصيل الطلب</Text>
        <Row label="رقم الطلب" value={order.number} />
        <Row label="النوع" value={order.requestTypeLabel} />
        <Row label="الباقة" value={`${order.serviceName} · ${order.durationLabel}`} />
        {order.deviceName ? <Row label="الجهاز" value={order.deviceName} /> : null}
        <Row label="المبلغ" value={formatPrice(order.price)} strong />
        {order.paymentMethod ? <Row label="طريقة الدفع" value={order.paymentMethod} /> : null}
        {order.paymentReference ? <Row label="رقم العملية" value={order.paymentReference} /> : null}
        <Row label="تاريخ الطلب" value={formatDateTime(order.createdAt)} />
      </Card>

      {order.events.length ? (
        <Card style={{ gap: space.md }}>
          <Text variant="heading">سجل الطلب</Text>
          {order.events
            .slice()
            .reverse()
            .map((event) => (
              <View key={event.id} style={styles.event}>
                <View style={styles.eventDot} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{event.summary}</Text>
                  <Text variant="caption" color={colors.ink3}>
                    {formatDateTime(event.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
        </Card>
      ) : null}

      <Button
        title="مساعدة بخصوص هذا الطلب"
        icon="chatbubbles-outline"
        variant="secondary"
        onPress={() => router.push({ pathname: '/support/new', params: { orderId: String(order.id), category: 'payment' } })}
      />

      {order.canCancel ? (
        <Button
          title="إلغاء الطلب"
          variant="danger"
          loading={cancel.isPending}
          onPress={() =>
            Alert.alert('إلغاء الطلب؟', 'تكدر تطلب من جديد بأي وقت.', [
              { text: 'رجوع', style: 'cancel' },
              {
                text: 'إلغاء الطلب',
                style: 'destructive',
                onPress: () =>
                  cancel.mutate(undefined, {
                    onSuccess: () => toast('تم إلغاء الطلب'),
                    onError: (error) => toast(errorMessage(error), 'error'),
                  }),
              },
            ])
          }
        />
      ) : null}
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text color={colors.ink3}>{label}</Text>
      <Text variant={strong ? 'heading' : 'label'} style={{ flexShrink: 1 }} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  event: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand, marginTop: 6 },
});
