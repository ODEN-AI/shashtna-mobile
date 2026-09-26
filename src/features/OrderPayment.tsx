import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiUrl, authHeaders, errorMessage } from '@/src/api/client';
import { ordersApi, type ProofFile } from '@/src/api/orders';
import type { OrderDetail } from '@/src/api/types';
import { formatDateTime, formatPrice } from '@/src/lib/format';
import { useUploadProof } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { CopyField } from '@/src/ui/CopyField';
import { Field } from '@/src/ui/Field';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, radius, space } from '@/src/ui/theme';

import { pickProof } from './proof';

/**
 * What the customer does next for an order, by journey stage — the same
 * rules as the website's OrderPaymentFlow: pay and upload the proof, wait
 * for review, or see the result. Used by the dashboard's order card and the
 * order screen.
 */
export function OrderPaymentFlow({ order }: { order: OrderDetail }) {
  if (order.stage === 'PAYMENT_PENDING') {
    return <PaymentCard order={order} />;
  }

  return (
    <>
      {order.stage === 'UNDER_REVIEW' ? (
        <Notice tone="info" icon="hourglass-outline">
          استلمنا إثبات الدفع وفريقنا يراجعه. الطلب يبقى غير مدفوع لحد ما يتأكد التحويل، وراح يوصلك إشعار.
        </Notice>
      ) : order.stage === 'PAID' ? (
        <Notice tone="success" icon="flash-outline">
          تم تأكيد الدفع ✅ طلبك بالدور للتفعيل.
        </Notice>
      ) : order.stage === 'ACTIVATED' && order.subscriptionId ? (
        <Button title="افتح الاشتراك" icon="tv-outline" onPress={() => router.push(`/subscriptions/${order.subscriptionId}`)} />
      ) : null}
      {order.proofUploadedAt ? <ProofPreview order={order} /> : null}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text color={colors.ink3}>{label}</Text>
      <Text variant="label" style={{ flexShrink: 1 }} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { alignItems: 'center', paddingVertical: space.md, borderRadius: radius.md, backgroundColor: colors.surface2 },
  pickRow: { flexDirection: 'row', gap: space.md },
  preview: { width: '100%', height: 260, borderRadius: radius.md, backgroundColor: colors.surface2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
});
