import { router } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import type { OrderDetail, OrderStage } from '@/src/api/types';
import { formatPrice } from '@/src/lib/format';
import { useHelp } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

const STEPS = ['استلمنا الحوالة', 'نتحقق منها', 'نفعّل'] as const;

/** How many steps are done and what we honestly say about the wait (never an invented duration). */
export function trackOf(stage: OrderStage): { done: number; line: string } {
  switch (stage) {
    case 'PACKAGE_SELECTED':
    case 'PAYMENT_PENDING':
      return { done: 0, line: 'حوّل المبلغ وارفع صورة الحوالة حتى نبدأ.' };
    case 'UNDER_REVIEW':
      return { done: 1, line: 'نتحقق من كل حوالة يدوياً. نبلّغك هنا أول ما نخلص.' };
    case 'PAID':
      return { done: 2, line: 'تأكد الدفع. فريقنا يفعّل اشتراكك وراح يوصلك إشعار.' };
    case 'ACTIVATED':
      return { done: 3, line: 'تفعّل اشتراكك.' };
    default:
      return { done: 0, line: '' };
  }
}

type Station = 'done' | 'current' | 'upcoming';

/** «طلبك الحالي»: three stations, the honest wait, and the one thing to do next. */
export function OrderTrack({ order }: { order: OrderDetail }) {
  const help = useHelp();
  const hours = help.data?.support.hours;
  const closed = order.stage === 'CANCELLED' || order.stage === 'REJECTED';
  const { done, line } = trackOf(order.stage);
  const waiting = !order.needsPayment && (order.stage === 'UNDER_REVIEW' || order.stage === 'PAID');
  const open = () => router.push(`/orders/${order.id}`);
  const stateOf = (index: number): Station => (index < done ? 'done' : index === done && !order.needsPayment ? 'current' : 'upcoming');

  return (
    <View style={styles.wrap} testID="order-track">
      <View style={styles.row}>
        <Text variant="heading">طلبك الحالي</Text>
        <Text variant="label" color={colors.ink2} style={styles.nums}>
          {formatPrice(order.price)}
        </Text>
      </View>
      <Text variant="caption" color={colors.ink3} numberOfLines={1}>
        {order.serviceName} · {order.requestTypeLabel}
      </Text>

      {closed ? (
        <Text variant="body" color={colors.ink2}>
          {order.statusHint || order.statusLabel}
        </Text>
      ) : (
        <>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={STEPS.map((step, index) => `${step}${stateOf(index) === 'done' ? '، تم' : stateOf(index) === 'current' ? '، الحين' : ''}`).join('. ')}
          >
            <View style={styles.rail}>
              {STEPS.map((step, index) => {
                const state = stateOf(index);

                return (
                  <Fragment key={step}>
                    {index > 0 ? <View style={[styles.line, state !== 'upcoming' && styles.lineDone]} /> : null}
                    <View style={[styles.ring, state === 'current' && styles.ringOn]}>
                      <View style={[styles.dot, state !== 'upcoming' && styles.dotDone]} />
                    </View>
                  </Fragment>
                );
              })}
            </View>
            <View style={styles.labels}>
              {STEPS.map((step, index) => {
                const state = stateOf(index);

                return (
                  <Text
                    key={step}
                    variant="caption"
                    weight={state === 'upcoming' ? 'medium' : 'bold'}
                    color={state === 'upcoming' ? colors.ink3 : colors.ink}
                    style={[styles.label, { textAlign: index === 0 ? 'left' : index === STEPS.length - 1 ? 'right' : 'center' }]}
                  >
                    {step}
                  </Text>
                );
              })}
            </View>
          </View>
          {line ? (
            <Text variant="body" color={colors.ink2}>
              {line}
              {waiting && hours ? ` نراجع الحوالات بأوقات الدوام: ${hours}.` : ''}
            </Text>
          ) : null}
        </>
      )}

      {order.needsPayment && !closed ? (
        <Button title="ادفع وارفع صورة الحوالة" icon="cloud-upload-outline" onPress={open} testID="order-pay" />
      ) : (
        <Button title="تفاصيل الطلب" variant="ghost" compact onPress={open} />
      )}
    </View>
  );
}

const DOT = 14;

const styles = StyleSheet.create({
  wrap: { gap: space.md, paddingTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  rail: { flexDirection: 'row', alignItems: 'center', marginVertical: space.sm },
  ring: { width: DOT + 10, height: DOT + 10, borderRadius: (DOT + 10) / 2, alignItems: 'center', justifyContent: 'center' },
  ringOn: { backgroundColor: 'rgba(36,86,230,0.25)' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.lineStrong },
  dotDone: { backgroundColor: colors.brand },
  line: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.lineStrong },
  lineDone: { backgroundColor: colors.brand },
  labels: { flexDirection: 'row' },
  label: { flex: 1 },
});
