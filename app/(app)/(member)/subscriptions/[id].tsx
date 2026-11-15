import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SubscriptionDetail } from '@/src/api/types';
import { lookOf, renew } from '@/src/features/home/HomeSections';
import { OrderCard } from '@/src/features/OrderCard';
import { formatDate, formatDateTime, formatPrice } from '@/src/lib/format';
import { useSubscription } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { CopyField } from '@/src/ui/CopyField';
import { Dial, Heading, Panel, Pill, Tile } from '@/src/ui/Kit';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, rgba, space } from '@/src/ui/theme';

const SERVICE: Record<string, string> = { IPTV: 'IPTV', VIP: 'VIP', DIGITAL: 'منصة رقمية' };

const LOOK = {
  active: { label: 'شغّال', dot: colors.success },
  expiring: { label: 'قرب ينتهي', dot: colors.amber },
  ended: { label: 'منتهي', dot: colors.dangerStrong },
} as const;

/** Subscription details (Stitch hub + copyable credential tiles). Credentials stay masked until the customer reveals them. */
export default function SubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useSubscription(Number(id));

  return (
    <>
      <Stack.Screen options={{ title: 'تفاصيل الاشتراك' }} />
      <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()} contentStyle={{ gap: space.xl }}>
        <QueryBoundary query={query}>{(data) => <Body data={data} />}</QueryBoundary>
      </Screen>
    </>
  );
}

function Body({ data }: { data: SubscriptionDetail }) {
  const { subscription, orders, receipts, events } = data;
  const look = lookOf(subscription);
  const meta = LOOK[look];
  const credentials = subscription.credentials as (SubscriptionDetail['subscription']['credentials'] & { accountEmail?: string | null }) | null;
  const [revealed, setRevealed] = useState(false);
  const days = Math.max(0, subscription.daysRemaining);
  const hasCredentials = Boolean(credentials && (credentials.username || credentials.password || credentials.macAddress || credentials.accountEmail || credentials.deviceId));

  return (
    <>
      <Panel style={styles.hero} testID="subscription-detail">
        <View style={styles.between}>
          <View style={styles.flex}>
            <Text variant="micro" color={colors.ink2}>
              الباقة · {SERVICE[subscription.serviceType] ?? subscription.serviceType}
            </Text>
            <Text variant="title" weight="bold">
              {subscription.packageName}
            </Text>
          </View>
          <Pill label={meta.label} dot={meta.dot} color={colors.ink} background={colors.canvasDeep} />
        </View>

        <View style={styles.meter}>
          <Dial size={88} stroke={6} fraction={look === 'ended' ? 0 : subscription.remainingFraction} color={look === 'expiring' ? colors.amber : colors.brand}>
            <Text variant="title" weight="bold" style={styles.dialNumber}>
              {days}
            </Text>
            <Text variant="micro" color={colors.ink2}>
              يوم
            </Text>
          </Dial>
          <View style={[styles.flex, { gap: space.sm }]}>
            <Row label="تاريخ البدء" value={formatDate(subscription.startDate)} />
            <Row label={look === 'ended' ? 'انتهى بتاريخ' : 'ينتهي بتاريخ'} value={formatDate(subscription.expiryDate)} />
            <Row label="عدد الأجهزة" value={String(subscription.maxConnections)} />
          </View>
        </View>
      </Panel>

      {look === 'expiring' ? <Notice tone="warning">اشتراكك ينتهي قريبًا. جدّده حتى تستمر المشاهدة بدون انقطاع.</Notice> : null}

      <View style={styles.actions}>
        {subscription.canRenew ? (
          <Button title={look === 'ended' ? 'رجّع اشتراكك' : 'تجديد'} icon="refresh" variant={look === 'active' ? 'primary' : 'amber'} style={styles.flex} onPress={() => renew(subscription)} testID="detail-renew" />
        ) : null}
        {subscription.serviceType !== 'DIGITAL' ? (
          <Button title="ترقية" icon="trending-up" variant="glass" style={styles.flex} onPress={() => router.push({ pathname: '/packages', params: { upgrade: String(subscription.id) } })} />
        ) : null}
      </View>

      {hasCredentials && credentials ? (
        <View style={styles.section}>
          <View style={styles.between}>
            <View style={styles.row}>
              <MaterialIcons name="vpn-key" size={20} color={colors.brandInk} />
              <Text variant="heading" weight="bold" accessibilityRole="header">
                بيانات التشغيل
              </Text>
            </View>
            <Pressable
              onPress={() => setRevealed((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel={revealed ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              style={styles.reveal}
              testID="reveal-credentials"
            >
              <MaterialIcons name={revealed ? 'visibility-off' : 'visibility'} size={18} color={colors.brandInk} />
              <Text variant="label" color={colors.brandInk}>
                {revealed ? 'إخفاء' : 'إظهار'}
              </Text>
            </Pressable>
          </View>
          <Panel style={{ gap: space.sm }}>
            {credentials.username ? <CopyField label="اسم المستخدم" value={credentials.username} /> : null}
            {credentials.password ? <CopyField label="كلمة المرور" value={credentials.password} secret revealed={revealed} /> : null}
            {credentials.accountEmail ? <CopyField label="إيميل الحساب" value={credentials.accountEmail} /> : null}
            {credentials.macAddress ? <CopyField label="عنوان MAC" value={credentials.macAddress} /> : null}
            {credentials.deviceId ? <CopyField label="رقم الجهاز" value={credentials.deviceId} /> : null}
          </Panel>
          <View style={styles.privacy}>
            <MaterialIcons name="lock" size={16} color={colors.amber} />
            <Text variant="caption" color={colors.ink2} style={styles.flex}>
              لا تشارك بيانات التشغيل ويا أحد. كلمة المرور تبقى مخفية لحد ما تضغط «إظهار».
            </Text>
          </View>
        </View>
      ) : (
        <Panel style={styles.waiting}>
          <Tile icon="hourglass-top" color={colors.sky} />
          <Text variant="caption" color={colors.ink2} style={styles.flex}>
            بيانات التشغيل تظهر هنا أول ما يجهزها فريقنا.
          </Text>
        </Panel>
      )}

      {orders.length ? (
        <View style={styles.section}>
          <Heading title="الطلبات المرتبطة" />
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      ) : null}

      {receipts.length ? (
        <View style={styles.section}>
          <Heading title="الإيصالات" />
          {receipts.map((receipt) => (
            <Panel key={receipt.id} style={styles.receipt}>
              <Tile icon="receipt-long" color={colors.sky} size={36} />
              <View style={styles.flex}>
                <Text variant="label" weight="semibold" style={{ writingDirection: 'ltr' }}>
                  {receipt.receiptNumber}
                </Text>
                <Text variant="caption" color={colors.ink2}>
                  {receipt.serviceName} · {formatDate(receipt.createdAt)}
                </Text>
              </View>
              <Text variant="label" weight="bold" color={colors.amber} style={styles.nums}>
                {formatPrice(receipt.price)}
              </Text>
            </Panel>
          ))}
        </View>
      ) : null}

      {events.length ? (
        <View style={styles.section}>
          <Heading title="السجل" />
          <Panel style={{ gap: space.md }}>
            {events
              .slice()
              .reverse()
              .map((event) => (
                <View key={event.id} style={styles.event}>
                  <View style={styles.eventDot} />
                  <View style={styles.flex}>
                    <Text variant="label">{event.summary}</Text>
                    <Text variant="caption" color={colors.ink3}>
                      {formatDateTime(event.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
          </Panel>
        </View>
      ) : null}

      <Button
        title="مساعدة بخصوص الاشتراك"
        icon="chatbubbles-outline"
        variant="glass"
        onPress={() => router.push({ pathname: '/support/new', params: { subscriptionId: String(subscription.id), category: 'subscription' } })}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text variant="caption" color={colors.ink2}>
        {label}
      </Text>
      <Text variant="label" style={styles.nums}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  section: { gap: space.md },
  hero: { gap: space.lg },
  meter: { flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.md, borderRadius: radius.sm, backgroundColor: colors.surfaceLow },
  dialNumber: { lineHeight: 26, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: space.md },
  reveal: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: rgba(colors.brand, 0.15) },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: rgba(colors.amberDeep, 0.08) },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  receipt: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  event: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand, marginTop: 6 },
});
