import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SubscriptionDetail } from '@/src/api/types';
import { OrderCard } from '@/src/features/OrderCard';
import { formatDate, formatDateTime, formatPrice, pluralDays } from '@/src/lib/format';
import { SUBSCRIPTION_STATE } from '@/src/lib/status';
import { useSubscription } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { CopyField } from '@/src/ui/CopyField';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export default function SubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useSubscription(Number(id));

  return (
    <>
      <Stack.Screen options={{ title: query.data?.subscription.packageName ?? 'الاشتراك' }} />
      <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        <QueryBoundary query={query}>{(data) => <Body data={data} />}</QueryBoundary>
      </Screen>
    </>
  );
}

function Body({ data }: { data: SubscriptionDetail }) {
  const { subscription, orders, receipts, events } = data;
  const meta = SUBSCRIPTION_STATE[subscription.state];
  const credentials = subscription.credentials;
  const [revealed, setRevealed] = useState(false);

  return (
    <>
      <Card style={{ gap: space.md }} glow={subscription.state === 'ACTIVE'}>
        <View style={styles.row}>
          <Badge label={meta.label} tone={meta.tone} dot />
          <Badge label={subscription.serviceType} tone="glow" />
        </View>
        <Text variant="title">{subscription.packageName}</Text>
        <Row label="تاريخ البدء" value={formatDate(subscription.startDate)} />
        <Row label="تاريخ الانتهاء" value={formatDate(subscription.expiryDate)} />
        <Row label="المتبقي" value={subscription.state === 'EXPIRED' ? 'منتهي' : pluralDays(subscription.daysRemaining)} />
        <Row label="عدد الأجهزة" value={String(subscription.maxConnections)} />
      </Card>

      {subscription.state === 'EXPIRING' ? <Notice tone="warning">اشتراكك ينتهي قريبًا. جدّده حتى تستمر المشاهدة بدون انقطاع.</Notice> : null}

      <View style={styles.actions}>
        {subscription.canRenew ? (
          <Button
            title="تجديد"
            icon="refresh"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/checkout', params: { renew: String(subscription.id) } })}
          />
        ) : null}
        <Button title="ترقية" icon="trending-up" variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/packages', params: { upgrade: String(subscription.id) } })} />
      </View>

      {credentials && (credentials.username || credentials.password || credentials.macAddress) ? (
        <Section title="بيانات الدخول" action={revealed ? 'إخفاء' : 'إظهار'} onAction={() => setRevealed((value) => !value)}>
          {credentials.username ? <CopyField label="اسم المستخدم" value={credentials.username} /> : null}
          {credentials.password ? <CopyField label="كلمة المرور" value={credentials.password} secret revealed={revealed} /> : null}
          {credentials.macAddress ? <CopyField label="MAC" value={credentials.macAddress} /> : null}
          <Text variant="caption" color={colors.ink3}>
            لا تشارك بيانات الدخول ويا أحد. تبقى مخفية لحد ما تضغط «إظهار».
          </Text>
        </Section>
      ) : null}

      {orders.length ? (
        <Section title="الطلبات المرتبطة">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Section>
      ) : null}

      {receipts.length ? (
        <Section title="الإيصالات">
          {receipts.map((receipt) => (
            <Card key={receipt.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="label">{receipt.receiptNumber}</Text>
                <Text variant="caption" color={colors.ink3}>
                  {receipt.serviceName} · {formatDate(receipt.createdAt)}
                </Text>
              </View>
              <Text variant="label">{formatPrice(receipt.price)}</Text>
            </Card>
          ))}
        </Section>
      ) : null}

      {events.length ? (
        <Section title="السجل">
          <Card style={{ gap: space.md }}>
            {events
              .slice()
              .reverse()
              .map((event) => (
                <View key={event.id}>
                  <Text variant="label">{event.summary}</Text>
                  <Text variant="caption" color={colors.ink3}>
                    {formatDateTime(event.createdAt)}
                  </Text>
                </View>
              ))}
          </Card>
        </Section>
      ) : null}

      <Button
        title="مساعدة بخصوص الاشتراك"
        icon="chatbubbles-outline"
        variant="secondary"
        onPress={() => router.push({ pathname: '/support/new', params: { subscriptionId: String(subscription.id), category: 'subscription' } })}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text color={colors.ink3}>{label}</Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.md },
});
