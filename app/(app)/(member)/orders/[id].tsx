import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/src/api/client';
import type { OrderDetail, OrderStage } from '@/src/api/types';
import { OrderPaymentFlow } from '@/src/features/OrderPayment';
import { formatDateTime, formatPrice } from '@/src/lib/format';
import { useCancelOrder, useHelp, useOrder } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Heading, Panel, Pill, Tile } from '@/src/ui/Kit';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, radius, rgba, space } from '@/src/ui/theme';

/**
 * «تتبع الطلب» (Stitch order tracking): where the order is, the honest manual
 * review, the transfer and proof, and how to reach the team. Payment details
 * and the proof upload are the same flow as the website's order panel.
 */
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const query = useOrder(orderId);

  return (
    <>
      <Stack.Screen options={{ title: 'تتبع الطلب' }} />
      <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()} contentStyle={styles.content}>
        <QueryBoundary query={query} rows={3}>
          {(order) => <OrderBody order={order} />}
        </QueryBoundary>
      </Screen>
    </>
  );
}

const HERO: Record<OrderStage, { chip: string; color: string; title: string }> = {
  PACKAGE_SELECTED: { chip: 'بانتظار الدفع', color: colors.amber, title: 'خطوة وحدة وتخلص' },
  PAYMENT_PENDING: { chip: 'بانتظار الدفع', color: colors.amber, title: 'خطوة وحدة وتخلص' },
  UNDER_REVIEW: { chip: 'جاري التدقيق البشري', color: colors.amber, title: 'طلبك بين أيدي فريقنا هسه' },
  PAID: { chip: 'قيد التفعيل', color: colors.sky, title: 'تأكد الدفع، نفعّل اشتراكك' },
  ACTIVATED: { chip: 'تم التفعيل', color: colors.success, title: 'اشتراكك جاهز للمشاهدة' },
  CANCELLED: { chip: 'ملغي', color: colors.ink3, title: 'الطلب ملغي' },
  REJECTED: { chip: 'مرفوض', color: colors.dangerStrong, title: 'ما كدرنا نقبل الطلب' },
};

const STEP_TEXT: Record<string, string> = {
  SELECT: 'اخترت الباقة وسجّلنا طلبك.',
  PAY: 'حوّل المبلغ على الرقم الظاهر بطلبك.',
  PROOF: 'ارفع صورة وصل التحويل من هنا.',
  REVIEW: 'فريقنا يطابق الحوالة يدوياً.',
  ACTIVATE: 'نفعّل اشتراكك ويوصلك إشعار، وبيانات التشغيل تظهر بصفحة «اشتراكي».',
};

type Step = { key: string; label: string; state: 'done' | 'current' | 'upcoming' };

/** The server's journey (choose → pay → proof → review) plus activation, which staff do by hand. */
function stepsOf(order: OrderDetail): Step[] {
  const activation: Step['state'] = order.stage === 'ACTIVATED' ? 'done' : order.stage === 'PAID' ? 'current' : 'upcoming';
  const journey = order.journey.map((step) => ({
    ...step,
    state: (order.stage === 'PAID' || order.stage === 'ACTIVATED') && step.state !== 'done' ? ('done' as const) : step.state,
  }));

  return [...journey, { key: 'ACTIVATE', label: 'تفعيل الاشتراك', state: activation }];
}

function OrderBody({ order }: { order: OrderDetail }) {
  const hero = HERO[order.stage];
  const closed = order.stage === 'CANCELLED' || order.stage === 'REJECTED';
  const cancel = useCancelOrder(order.id);
  const help = useHelp();
  const toast = useToast();
  const support = help.data?.support;

  return (
    <>
      <View style={styles.hero} testID="order-hero">
        <View style={[styles.bloom, styles.bloomAmber]} pointerEvents="none" />
        <View style={[styles.bloom, styles.bloomBlue]} pointerEvents="none" />
        <View style={styles.between}>
          <Pill label={hero.chip} dot={hero.color} color={hero.color} background={colors.surface} style={styles.heroChip} />
          <Text variant="micro" color={colors.ink2} style={styles.ltr}>
            #{order.number}
          </Text>
        </View>
        <View style={{ gap: space.xs }}>
          <Text variant="title" weight="bold">
            {hero.title}
          </Text>
          <Text variant="body" color={colors.ink2}>
            {order.statusHint}
          </Text>
        </View>
        <View style={styles.ribbon}>
          <View style={[styles.row, styles.flex]}>
            <Tile icon="live-tv" color={colors.brandInk} background={colors.surface} />
            <View style={styles.flex}>
              <Text variant="label" weight="bold" numberOfLines={1} style={{ fontSize: 16 }}>
                {order.serviceName}
              </Text>
              <Text variant="caption" color={colors.ink2} numberOfLines={1}>
                {order.requestTypeLabel} · {order.durationLabel}
                {order.deviceName ? ` + ${order.deviceName}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.priceCol}>
            <Text variant="label" weight="bold" color={colors.amber} style={[styles.nums, { fontSize: 16 }]}>
              {formatPrice(order.price)}
            </Text>
            {order.paymentMethod ? (
              <Text variant="micro" color={colors.ink2}>
                {order.paymentMethod}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {!closed ? (
        <View style={styles.section}>
          <Heading title="مسار معالجة الطلب" />
          <Panel style={styles.timeline} testID="order-timeline">
            {stepsOf(order).map((step, index, all) => (
              <TimelineStep key={step.key} step={step} last={index === all.length - 1} time={step.key === 'SELECT' ? formatDateTime(order.createdAt) : null} />
            ))}
          </Panel>
        </View>
      ) : null}

      <OrderPaymentFlow order={order} />

      {order.stage === 'ACTIVATED' && order.subscriptionId ? (
        <Button title="افتح الاشتراك" icon="tv-outline" onPress={() => router.push(`/subscriptions/${order.subscriptionId}`)} />
      ) : null}

      <Panel style={styles.team}>
        <Tile icon="support-agent" color={colors.sky} size={48} background={rgba(colors.sky, 0.12)} />
        <View style={styles.flex}>
          <Text variant="label" weight="bold" style={{ fontSize: 16 }}>
            فريقنا متواجد وحاضر وياك
          </Text>
          <Text variant="caption" color={colors.ink2}>
            {support?.hours ? `نراجع الحوالات بأوقات الدوام: ${support.hours}. ` : ''}
            الطلبات تترتب بالأسبقية حتى ما يفوتك شي.
          </Text>
        </View>
      </Panel>

      <Panel style={{ gap: space.md }}>
        <Text variant="heading" weight="bold">
          تفاصيل الطلب
        </Text>
        <Row label="رقم الطلب" value={order.number} />
        <Row label="النوع" value={order.requestTypeLabel} />
        <Row label="الباقة" value={`${order.serviceName} · ${order.durationLabel}`} />
        {order.deviceName ? <Row label="الجهاز" value={order.deviceName} /> : null}
        <Row label="المبلغ" value={formatPrice(order.price)} strong />
        {order.paymentReference ? <Row label="رقم العملية" value={order.paymentReference} /> : null}
        <Row label="تاريخ الطلب" value={formatDateTime(order.createdAt)} />
      </Panel>

      {support?.whatsapp ? (
        <Button title="تواصل ويا الفريق على واتساب" icon="logo-whatsapp" onPress={() => void Linking.openURL(support.whatsapp!).catch(() => undefined)} />
      ) : null}
      <Button
        title="مساعدة بخصوص هذا الطلب"
        icon="chatbubbles-outline"
        variant="glass"
        onPress={() => router.push({ pathname: '/support/new', params: { orderId: String(order.id), category: 'payment' } })}
      />
      <Button title="الرجوع للرئيسية" icon="home-outline" variant="ghost" onPress={() => router.navigate('/')} />

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

function TimelineStep({ step, last, time }: { step: Step; last: boolean; time: string | null }) {
  const done = step.state === 'done';
  const current = step.state === 'current';

  return (
    <View style={[styles.step, !last && { paddingBottom: space.xl }]} accessibilityLabel={`${step.label}${done ? '، تم' : current ? '، الحين' : ''}`}>
      {!last ? <View style={[styles.connector, done && { backgroundColor: rgba(colors.brandInk, 0.4) }]} /> : null}
      <View style={[styles.node, done && styles.nodeDone, current && styles.nodeCurrent]}>
        <MaterialIcons name={done ? 'check' : current ? 'autorenew' : 'radio-button-unchecked'} size={18} color={done ? '#002A78' : current ? colors.onAmber : colors.ink3} />
      </View>
      <View style={[styles.flex, current && styles.currentBox]}>
        <View style={styles.between}>
          <Text variant="label" weight="semibold" color={current ? colors.amber : done ? colors.ink : colors.ink3} style={{ fontSize: 16 }}>
            {step.label}
          </Text>
          {current ? (
            <Pill label="الحين" color={colors.amber} background={rgba(colors.amberDeep, 0.2)} />
          ) : time && done ? (
            <Text variant="micro" color={colors.ink2}>
              {time}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" color={step.state === 'upcoming' ? colors.ink3 : colors.ink2}>
          {STEP_TEXT[step.key] ?? ''}
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.between}>
      <Text color={colors.ink3}>{label}</Text>
      <Text variant={strong ? 'heading' : 'label'} style={{ flexShrink: 1 }} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  ltr: { writingDirection: 'ltr' },
  section: { gap: space.sm },
  hero: { gap: space.sm, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.surface2, overflow: 'hidden', boxShadow: '0px 8px 24px rgba(0,0,0,0.45)' },
  heroChip: { paddingVertical: 4 },
  bloom: { position: 'absolute', width: 144, height: 144, borderRadius: 72 },
  bloomAmber: { top: -48, start: -48, backgroundColor: rgba(colors.amberDeep, 0.12) },
  bloomBlue: { bottom: -40, end: -40, backgroundColor: rgba(colors.brand, 0.15) },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: space.sm,
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(8, 14, 30, 0.6)',
  },
  priceCol: { alignItems: 'flex-end' },
  timeline: { padding: space.lg },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },
  connector: { position: 'absolute', top: 32, bottom: 0, start: 15, width: 2, backgroundColor: colors.surface3 },
  node: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  nodeDone: { backgroundColor: colors.brandInk, boxShadow: '0px 0px 12px rgba(180, 197, 255, 0.4)' },
  nodeCurrent: { backgroundColor: colors.amber },
  currentBox: { padding: space.md, marginTop: -space.sm, borderRadius: radius.md, backgroundColor: colors.surface2 },
  team: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
});
