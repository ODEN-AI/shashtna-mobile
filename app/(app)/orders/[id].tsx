import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { apiUrl, authHeaders, errorMessage } from '@/src/api/client';
import { ordersApi, type ProofFile } from '@/src/api/orders';
import type { OrderDetail } from '@/src/api/types';
import { pickProof } from '@/src/features/proof';
import { formatDateTime, formatPrice } from '@/src/lib/format';
import { ORDER_STAGE } from '@/src/lib/status';
import { useCancelOrder, useOrder, useUploadProof } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { CopyField } from '@/src/ui/CopyField';
import { Field } from '@/src/ui/Field';
import { IconWell } from '@/src/ui/IconWell';
import { Journey } from '@/src/ui/Journey';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, radius, space } from '@/src/ui/theme';

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

      {order.needsPayment ? <PaymentCard order={order} /> : null}

      {order.stage === 'UNDER_REVIEW' ? (
        <Notice tone="info" icon="hourglass-outline">
          استلمنا إثبات الدفع وفريقنا يراجعه. راح يوصلك إشعار أول ما يتأكد.
        </Notice>
      ) : null}

      {order.stage === 'ACTIVATED' && order.subscriptionId ? (
        <Button title="افتح الاشتراك" icon="tv-outline" onPress={() => router.push(`/subscriptions/${order.subscriptionId}`)} />
      ) : null}

      {order.proofUploadedAt ? <ProofPreview order={order} /> : null}

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

function PaymentCard({ order }: { order: OrderDetail }) {
  const upload = useUploadProof(order.id);
  const toast = useToast();
  const [file, setFile] = useState<ProofFile | null>(null);
  const [reference, setReference] = useState(order.paymentReference ?? '');
  const [pickError, setPickError] = useState<string | null>(null);
  const transfer = order.payment.transfer;

  async function choose(source: 'library' | 'camera') {
    setPickError(null);

    try {
      const result = await pickProof(source);
      if (!result) return;
      if ('error' in result) return setPickError(result.error);
      setFile(result.file);
    } catch {
      setPickError('تعذر تجهيز الصورة. جرّب صورة ثانية.');
    }
  }

  return (
    <Card style={{ gap: space.lg }} glow>
      <View style={{ gap: 4 }}>
        <Text variant="heading">ادفع بالتحويل</Text>
        <Text variant="caption" color={colors.ink2}>
          حوّل المبلغ بالضبط، وبعدها ارفع صورة الإثبات هنا.
        </Text>
      </View>

      <View style={styles.amount}>
        <Text variant="caption" color={colors.ink3}>
          المبلغ المطلوب
        </Text>
        <Text variant="hero" color={colors.ink}>
          {formatPrice(order.price)}
        </Text>
      </View>

      {transfer ? (
        <>
          <CopyField label="رقم التحويل" value={transfer.transferNumber} />
          {transfer.recipientName ? <Row label="اسم المستلم" value={transfer.recipientName} /> : null}
        </>
      ) : (
        <Notice tone="warning">رقم التحويل غير متوفر حاليًا. تواصل ويا الدعم حتى نرسله إلك.</Notice>
      )}

      {order.payment.instructions ? (
        <Text variant="caption" color={colors.ink2}>
          {order.payment.instructions}
        </Text>
      ) : null}

      <Notice tone="warning" icon="shield-checkmark-outline">
        شاشتنا ما تطلب منك أبدًا رمز PIN أو OTP أو CVV.
      </Notice>

      <View style={{ gap: space.md }}>
        <Text variant="label">صورة إثبات الدفع</Text>
        {file ? (
          <Image source={file.uri} style={styles.preview} contentFit="contain" accessibilityLabel="معاينة صورة الإثبات" />
        ) : null}
        <View style={styles.pickRow}>
          <Button title={file ? 'تغيير الصورة' : 'اختيار من الصور'} icon="images-outline" variant="secondary" compact style={{ flex: 1 }} onPress={() => void choose('library')} />
          <Button title="الكاميرا" icon="camera-outline" variant="secondary" compact style={{ flex: 1 }} onPress={() => void choose('camera')} />
        </View>
        {pickError ? <Notice tone="danger">{pickError}</Notice> : null}
      </View>

      <Field
        label="رقم العملية / المرجع (اختياري)"
        value={reference}
        onChangeText={setReference}
        maxLength={120}
        ltr
        hint="يساعد فريقنا يتأكد من التحويل أسرع."
      />

      {upload.isError ? <Notice tone="danger">{errorMessage(upload.error)}</Notice> : null}

      <Button
        title="إرسال الإثبات"
        icon="cloud-upload-outline"
        disabled={!file}
        loading={upload.isPending}
        onPress={() =>
          file &&
          upload.mutate(
            { file, reference },
            {
              onSuccess: (result) => {
                setFile(null);
                toast(result.message);
              },
            },
          )
        }
        testID="upload-proof"
      />
    </Card>
  );
}

function ProofPreview({ order }: { order: OrderDetail }) {
  return (
    <Card style={{ gap: space.md }}>
      <Text variant="heading">إثبات الدفع المرفوع</Text>
      <Image
        source={{ uri: apiUrl(ordersApi.proofPath(order.id)), headers: authHeaders(), cacheKey: `proof-${order.id}-${order.proofUploadedAt}` }}
        cachePolicy="memory"
        style={styles.preview}
        contentFit="contain"
        accessibilityLabel="صورة إثبات الدفع"
      />
      <Text variant="caption" color={colors.ink3}>
        رُفع {formatDateTime(order.proofUploadedAt)}
      </Text>
    </Card>
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
  amount: { alignItems: 'center', paddingVertical: space.md, borderRadius: radius.md, backgroundColor: colors.surface2 },
  pickRow: { flexDirection: 'row', gap: space.md },
  preview: { width: '100%', height: 260, borderRadius: radius.md, backgroundColor: colors.surface2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  event: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  eventDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand, marginTop: 6 },
});
