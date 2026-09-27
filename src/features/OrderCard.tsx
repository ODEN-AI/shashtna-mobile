import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Order, OrderStage } from '@/src/api/types';
import { formatDate, formatPrice } from '@/src/lib/format';
import { ORDER_STAGE } from '@/src/lib/status';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

/** The backend's order stages as a visual journey: created → payment → review → paid → activated. */
export const ORDER_STEPS: { stage: OrderStage; label: string }[] = [
  { stage: 'PACKAGE_SELECTED', label: 'الطلب' },
  { stage: 'PAYMENT_PENDING', label: 'الدفع' },
  { stage: 'UNDER_REVIEW', label: 'المراجعة' },
  { stage: 'PAID', label: 'مدفوع' },
  { stage: 'ACTIVATED', label: 'التفعيل' },
];

export function stepIndex(stage: OrderStage) {
  return ORDER_STEPS.findIndex((step) => step.stage === stage);
}

/** Compact progress line with the current step labelled. Ended orders show a closed state instead. */
export function OrderProgress({ stage }: { stage: OrderStage }) {
  const current = stepIndex(stage);

  if (current === -1) {
    const meta = ORDER_STAGE[stage];
    return (
      <View style={styles.ended}>
        <Ionicons name={meta.icon as never} size={16} color={colors.ink3} />
        <Text variant="caption" color={colors.ink3}>
          {stage === 'REJECTED' ? 'تم رفض الطلب' : 'تم إلغاء الطلب'}
        </Text>
      </View>
    );
  }

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={`المرحلة ${current + 1} من ${ORDER_STEPS.length}: ${ORDER_STEPS[current].label}`}>
      <View style={styles.track}>
        {ORDER_STEPS.map((step, index) => (
          <View key={step.stage} style={styles.segment}>
            <View style={[styles.node, index < current && styles.nodeDone, index === current && styles.nodeCurrent]}>
              {index < current || (index === current && stage === 'ACTIVATED') ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
            </View>
            {index < ORDER_STEPS.length - 1 ? <View style={[styles.line, index < current && styles.lineDone]} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {ORDER_STEPS.map((step, index) => (
          <Text
            key={step.stage}
            variant="caption"
            numberOfLines={1}
            color={index === current ? colors.ink : index < current ? colors.ink2 : colors.ink3}
            weight={index === current ? 'bold' : 'medium'}
            style={styles.label}
          >
            {step.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export type OrderFilter = 'ALL' | 'PAY' | 'ACTIVE' | 'DONE' | 'CLOSED';

/** Filters over the backend's own order states. */
export const ORDER_FILTERS: Record<OrderFilter, { label: string; test: (order: Order) => boolean }> = {
  ALL: { label: 'الكل', test: () => true },
  PAY: { label: 'بانتظار الدفع', test: (order) => order.needsPayment },
  ACTIVE: { label: 'قيد التنفيذ', test: (order) => order.isOpen && !order.needsPayment },
  DONE: { label: 'مكتملة', test: (order) => order.stage === 'ACTIVATED' },
  CLOSED: { label: 'ملغاة', test: (order) => order.stage === 'CANCELLED' || order.stage === 'REJECTED' },
};

export const OrderCard = memo(function OrderCard({ order }: { order: Order }) {
  const meta = ORDER_STAGE[order.stage];
  const open = () => router.push(`/orders/${order.id}`);

  return (
    <Card onPress={open} accessibilityLabel={`طلب ${order.number}، ${order.serviceName}، ${meta.label}، ${formatPrice(order.price)}`} style={styles.card} testID={`order-${order.id}`}>
      <View style={styles.row}>
        <Text variant="label" color={colors.ink2} style={styles.number}>
          {order.number}
        </Text>
        <Text variant="caption" color={colors.ink3}>
          {formatDate(order.createdAt)}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="heading" numberOfLines={2}>
            {order.serviceName}
            {order.deviceName ? ` + ${order.deviceName}` : ''}
          </Text>
          <Text variant="caption" color={colors.ink3}>
            {order.requestTypeLabel} · {order.durationLabel}
          </Text>
        </View>
        <Text variant="heading">{formatPrice(order.price)}</Text>
      </View>

      <Badge label={meta.label} tone={meta.tone} dot={order.isOpen} />
      <OrderProgress stage={order.stage} />

      <View style={styles.actions}>
        {order.needsPayment ? <Button title="ادفع الآن" icon="wallet-outline" compact onPress={open} style={{ flex: 1 }} /> : null}
        <Button title="التفاصيل" variant="glass" compact onPress={open} style={{ flex: 1 }} />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  number: { writingDirection: 'ltr' },
  track: { flexDirection: 'row', alignItems: 'center' },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  node: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  nodeDone: { backgroundColor: colors.active, borderColor: colors.active },
  nodeCurrent: { backgroundColor: colors.brand, borderColor: colors.ice, borderWidth: 2, boxShadow: '0px 0px 10px rgba(55, 129, 252, 0.8)' },
  line: { flex: 1, height: 2, marginHorizontal: 2, backgroundColor: colors.lineStrong, borderRadius: 1 },
  lineDone: { backgroundColor: colors.active },
  labels: { flexDirection: 'row', marginTop: 6 },
  label: { flex: 1, fontSize: 10.5, lineHeight: 14 },
  ended: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.md },
});
