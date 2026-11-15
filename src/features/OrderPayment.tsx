import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { apiUrl, authHeaders, errorMessage } from '@/src/api/client';
import { ordersApi, type ProofFile } from '@/src/api/orders';
import type { OrderDetail } from '@/src/api/types';
import { formatDateTime, formatPrice } from '@/src/lib/format';
import { useUploadProof } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { CopyField } from '@/src/ui/CopyField';
import { Field } from '@/src/ui/Field';
import { Heading, Panel, Pill, Tile } from '@/src/ui/Kit';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, radius, rgba, space } from '@/src/ui/theme';

import { pickProof } from './proof';

/**
 * What the customer does next for an order, by journey stage — the same
 * rules as the website's OrderPaymentFlow: pay and upload the proof, wait
 * for review, or see the result. Drawn with the Stitch payment patterns
 * (method badge, copyable transfer number, dashed receipt drop zone).
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
    <View style={styles.section} testID="payment-card">
      <Heading title="ادفع بالتحويل" />

      <Panel style={styles.amount}>
        <Text variant="micro" color={colors.ink2}>
          المبلغ المطلوب بالضبط
        </Text>
        <Text variant="display" weight="bold" color={colors.amber} style={styles.nums}>
          {formatPrice(order.price)}
        </Text>
        <Text variant="caption" color={colors.ink2}>
          {order.serviceName} · {order.durationLabel}
        </Text>
      </Panel>

      <View style={styles.method} accessibilityRole="radio" accessibilityState={{ checked: true }} accessibilityLabel={`طريقة الدفع: ${order.paymentMethod ?? 'تحويل يدوي'}`}>
        <Tile icon="account-balance-wallet" color={colors.amber} background={rgba(colors.amber, 0.12)} />
        <View style={styles.flex}>
          <Text variant="label" weight="bold" style={{ fontSize: 16 }}>
            {order.paymentMethod ?? 'تحويل يدوي'}
          </Text>
          <Text variant="caption" color={colors.ink2}>
            سوبر كي (Qi Card) أو حوالة على الرقم التالي
          </Text>
        </View>
        <View style={styles.check}>
          <MaterialIcons name="check" size={14} color={colors.onBrand} />
        </View>
      </View>

      {transfer ? (
        <View style={{ gap: space.sm }}>
          <CopyField label="رقم التحويل" value={transfer.transferNumber} />
          {transfer.recipientName ? (
            <View style={styles.recipient}>
              <Text variant="caption" color={colors.ink2}>
                اسم المستلم
              </Text>
              <Text variant="label" weight="semibold" selectable>
                {transfer.recipientName}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Notice tone="warning">رقم التحويل غير متوفر حاليًا. تواصل ويا الدعم حتى نرسله إلك.</Notice>
      )}

      {order.payment.instructions ? (
        <Text variant="caption" color={colors.ink2}>
          {order.payment.instructions}
        </Text>
      ) : null}

      <View style={styles.safety}>
        <MaterialIcons name="verified-user" size={18} color={colors.amber} />
        <Text variant="caption" color={colors.ink2} style={styles.flex}>
          شاشتنا ما تطلب منك أبدًا رمز PIN أو OTP أو CVV.
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        <Text variant="label" weight="semibold">
          صورة وصل التحويل
        </Text>
        {file ? (
          <View style={styles.thumbWrap}>
            <Image source={file.uri} style={styles.thumb} contentFit="contain" accessibilityLabel="معاينة صورة الوصل" />
            <Pressable onPress={() => setFile(null)} accessibilityRole="button" accessibilityLabel="شيل الصورة" hitSlop={10} style={styles.remove}>
              <MaterialIcons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => void choose('library')} accessibilityRole="button" accessibilityLabel="ارفع صورة الوصل من الصور" style={({ pressed }) => [styles.drop, pressed && styles.dropOn]} testID="proof-drop">
            <MaterialIcons name="cloud-upload" size={36} color={colors.brandInk} />
            <Text variant="label" weight="semibold" center>
              ارفع صورة وصل التحويل أو لقطة الشاشة
            </Text>
            <Text variant="micro" color={colors.ink3} center>
              صورة واضحة، الحد الأقصى 4 ميغابايت
            </Text>
          </Pressable>
        )}
        <View style={styles.pickRow}>
          <Button title={file ? 'تغيير الصورة' : 'من الصور'} icon="images-outline" variant="glass" compact style={styles.flex} onPress={() => void choose('library')} />
          <Button title="الكاميرا" icon="camera-outline" variant="glass" compact style={styles.flex} onPress={() => void choose('camera')} />
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
        title={file ? 'إرسال الوصل' : 'اختار صورة الوصل أولاً'}
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
    </View>
  );
}

/** «وصل التحويل المرفوع» (Stitch order tracking): the uploaded receipt with its amount. */
function ProofPreview({ order }: { order: OrderDetail }) {
  return (
    <View style={styles.section}>
      <Heading title="وصل التحويل المرفوع" />
      <Panel style={{ gap: space.md }}>
        <View>
          <Image
            source={{ uri: apiUrl(ordersApi.proofPath(order.id)), headers: authHeaders(), cacheKey: `proof-${order.id}-${order.proofUploadedAt}` }}
            cachePolicy="memory"
            style={styles.receipt}
            contentFit="cover"
            accessibilityLabel="صورة وصل التحويل"
          />
          <Pill label={formatPrice(order.price)} icon="receipt" color={colors.ink} background="rgba(8, 14, 30, 0.85)" style={styles.receiptChip} />
        </View>
        <Text variant="caption" color={colors.ink2}>
          رُفع {formatDateTime(order.proofUploadedAt)}
          {order.paymentReference ? ` · المرجع ${order.paymentReference}` : ''}
        </Text>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  nums: { fontVariant: ['tabular-nums'] },
  section: { gap: space.md },
  amount: { alignItems: 'center', gap: 2, paddingVertical: space.xl },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.sky,
    boxShadow: '0px 0px 16px rgba(123, 208, 255, 0.18)',
  },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  recipient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingHorizontal: space.lg },
  safety: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: rgba(colors.amberDeep, 0.08) },
  drop: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 160,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.surface3,
    backgroundColor: colors.canvasDeep,
  },
  dropOn: { borderColor: colors.brand },
  thumbWrap: { borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brand, backgroundColor: colors.canvasDeep, padding: space.sm },
  thumb: { width: '100%', height: 240, borderRadius: radius.md },
  remove: { position: 'absolute', top: space.md, end: space.md, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerStrong },
  pickRow: { flexDirection: 'row', gap: space.md },
  receipt: { width: '100%', aspectRatio: 16 / 10, borderRadius: radius.md, backgroundColor: colors.surface2 },
  receiptChip: { position: 'absolute', bottom: space.sm, start: space.sm, paddingVertical: 4 },
});
