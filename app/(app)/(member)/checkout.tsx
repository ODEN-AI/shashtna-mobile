import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError, errorMessage } from '@/src/api/client';
import type { Checkout, ContactOption } from '@/src/api/types';
import { formatPrice } from '@/src/lib/format';
import { useCatalog, useCheckout, useCreateOrder } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { Field } from '@/src/ui/Field';
import type { IconName } from '@/src/ui/IconWell';
import { Screen } from '@/src/ui/Screen';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

const CONTACT: Record<ContactOption, { label: string; hint: string; icon: IconName }> = {
  WHATSAPP: { label: 'واتساب', hint: 'نراسلك على واتساب', icon: 'logo-whatsapp' },
  TELEGRAM: { label: 'تيليجرام', hint: 'نراسلك على تيليجرام', icon: 'paper-plane-outline' },
  FACEBOOK: { label: 'فيسبوك / ماسنجر', hint: 'نراسلك على ماسنجر', icon: 'logo-facebook' },
  PHONE: { label: 'اتصال هاتفي', hint: 'نتصل بيك على رقمك', icon: 'call-outline' },
};

const TITLES: Record<Checkout['mode'], string> = {
  NEW: 'تأكيد الطلب',
  RENEW: 'تأكيد التجديد',
  UPGRADE: 'تأكيد الترقية',
  DEVICE_PURCHASE: 'تأكيد شراء الجهاز',
};

/**
 * Order confirmation — the same structure and rules as the website checkout
 * (بيانات العميل، تفاصيل الباقة، طريقة التواصل، ملاحظة، ملخص الطلب). The
 * selection is resolved by the backend's checkout service; payment continues
 * on the dashboard after the order exists.
 */
export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ plan?: string; option?: string; renew?: string; upgrade?: string; device?: string }>();
  const query = useCheckout({
    plan: params.plan,
    option: Number(params.option) || undefined,
    renew: Number(params.renew) || undefined,
    upgrade: Number(params.upgrade) || undefined,
    device: Number(params.device) || undefined,
  });

  return (
    <>
      <Stack.Screen options={{ title: query.data ? TITLES[query.data.mode] : 'تأكيد الطلب' }} />
      {query.data ? (
        <CheckoutBody key={`${query.data.mode}-${query.data.plan?.slug ?? query.data.device?.id}`} data={query.data} />
      ) : (
        <Screen>
          {query.isError ? (
            query.error instanceof ApiError && query.error.kind === 'not_found' ? (
              <EmptyState
                icon="alert-circle-outline"
                tone="warning"
                title="هذا الاختيار غير متاح حاليًا"
                body={query.error.message}
                action={<Button title="الباقات المتاحة" onPress={() => router.replace('/packages')} />}
              />
            ) : (
              <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            )
          ) : (
            <LoadingState rows={3} />
          )}
        </Screen>
      )}
    </>
  );
}

function CheckoutBody({ data }: { data: Checkout }) {
  const createOrder = useCreateOrder();
  const [deviceId, setDeviceId] = useState<number | null>(data.initialDeviceId);
  const [contact, setContact] = useState<ContactOption>(data.initialContact);
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');
  const catalog = useCatalog();
  // Platforms delivered on the customer's own account need its e-mail (the server checks it again).
  const groupId = catalog.data?.packages.find((pkg) => pkg.slug === data.plan?.slug)?.groupId;
  const needsEmail = data.mode !== 'RENEW' && catalog.data?.groups?.find((group) => group.id === groupId)?.delivery === 'CUSTOMER_EMAIL';

  const needsDevice = data.devices.length > 0 || (data.plan?.serviceType === 'VIP' && data.mode !== 'RENEW');
  const device = data.device ?? data.devices.find((item) => item.id === deviceId) ?? null;
  const ready = (!needsDevice || Boolean(device)) && (!needsEmail || /^\S+@\S+\.\S+$/.test(email.trim()));
  const total = (data.plan?.price ?? 0) + (device ? device.price : 0);
  let step = 0;

  async function confirm() {
    try {
      const result = await createOrder.mutateAsync({
        requestType: data.mode,
        planSlug: data.plan?.slug,
        optionId: data.plan?.optionId ?? undefined,
        deviceId: device?.id,
        deliveryEmail: needsEmail ? email.trim() : undefined,
        subscriptionId: data.subscription?.id,
        contactMethod: contact,
        customerNote: note.trim() || undefined,
      });

      // Like the website: continue to the dashboard, where payment happens.
      if (router.canDismiss()) router.dismissAll();
      router.replace({ pathname: '/', params: { order: String(result.order.id), created: '1' } });
    } catch {
      // Shown inline.
    }
  }

  return (
    <Screen
      footer={
        <View style={{ gap: space.sm }}>
          <View style={styles.row}>
            <Text color={colors.ink2}>الإجمالي</Text>
            <Text variant="heading" testID="checkout-total">
              {ready ? formatPrice(total) : '—'}
            </Text>
          </View>
          <Button
            title={ready ? 'تأكيد الطلب' : needsDevice && !device ? 'اختار الجهاز أولًا' : 'اكتب إيميل حسابك'}
            icon="checkmark-circle"
            disabled={!ready}
            loading={createOrder.isPending}
            onPress={confirm}
            testID="confirm-order"
          />
        </View>
      }
    >
      {data.subscription ? (
        <Notice tone="info">
          {data.mode === 'RENEW'
            ? `تجديد «${data.subscription.packageName}». المدة الجديدة تنضاف من تاريخ الانتهاء الحالي إذا الاشتراك بعده نشط.`
            : `ترقية «${data.subscription.packageName}».`}
        </Notice>
      ) : null}

      <Section index={++step} title="بيانات العميل">
        <Row label="الاسم" value={data.customer.name} />
        <Row label="رقم الهاتف" value={data.customer.phone} ltr />
      </Section>

      <Section index={++step} title={data.mode === 'DEVICE_PURCHASE' ? 'تفاصيل الجهاز' : 'تفاصيل الباقة'}>
        {data.plan ? (
          <>
            <View style={styles.badges}>
              <Badge label={data.plan.serviceType} tone={data.plan.serviceType === 'VIP' ? 'glow' : 'brand'} />
              {data.mode === 'RENEW' ? <Badge label="تجديد" /> : data.mode === 'UPGRADE' ? <Badge label="ترقية" /> : null}
              <Badge label={`المدة: ${data.plan.durationLabel}`} />
            </View>
            <Text variant="heading">{data.plan.name}</Text>
            {data.plan.description ? <Text color={colors.ink2}>{data.plan.description}</Text> : null}
            {data.plan.features.map((feature) => (
              <View key={feature} style={styles.feature}>
                <Ionicons name="checkmark" size={16} color={colors.glow} />
                <Text variant="caption" color={colors.ink2} style={{ flex: 1 }}>
                  {feature}
                </Text>
              </View>
            ))}
          </>
        ) : data.device ? (
          <>
            <Badge label="جهاز VIP" tone="glow" />
            <Text variant="heading">{data.device.name}</Text>
            <Text color={colors.ink2}>{data.device.description}</Text>
          </>
        ) : null}

        {needsDevice && !data.device ? (
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <Text variant="label">جهاز VIP</Text>
            {data.devices.length ? (
              data.devices.map((item) => {
                const selected = item.id === deviceId;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setDeviceId(item.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Ionicons name={selected ? 'checkmark-circle' : 'hardware-chip-outline'} size={22} color={selected ? colors.glow : colors.ink3} />
                    <View style={{ flex: 1 }}>
                      <Text variant="label">{item.name}</Text>
                      <Text variant="caption" color={colors.ink3} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    <Text variant="label">+ {formatPrice(item.price)}</Text>
                  </Pressable>
                );
              })
            ) : (
              <Notice tone="warning">ماكو جهاز VIP متوافق مع هاي الباقة حاليًا. تواصل ويانا أو اختار باقة ثانية.</Notice>
            )}
          </View>
        ) : null}
      </Section>

      {needsEmail ? (
        <Section index={++step} title="إيميل حسابك على المنصة">
          <Text color={colors.ink2}>نفعّل الاشتراك على هذا الإيميل.</Text>
          <Field label="الإيميل" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" testID="checkout-email" />
        </Section>
      ) : null}

      <Section index={++step} title="طريقة التواصل">
        <Text color={colors.ink2}>شلون تحب نتواصل وياك بخصوص هذا الطلب؟</Text>
        {data.contactOptions.map((option) => {
          const selected = contact === option;

          return (
            <Pressable
              key={option}
              onPress={() => setContact(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[styles.option, selected && styles.contactSelected]}
              testID={`contact-${option}`}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={CONTACT[option].icon} size={20} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label">{CONTACT[option].label}</Text>
                <Text variant="caption" color={colors.ink3}>
                  {CONTACT[option].hint}
                </Text>
              </View>
              {selected ? <Ionicons name="checkmark" size={20} color={colors.glow} /> : null}
            </Pressable>
          );
        })}
      </Section>

      <Section index={++step} title="ملاحظة للطلب">
        <Field label="ملاحظة (اختياري)" value={note} onChangeText={setNote} maxLength={500} multiline placeholder="مثلًا: أفضل وقت للتواصل" />
      </Section>

      <Card style={{ gap: space.md }} glow>
        <Text variant="heading">ملخص الطلب</Text>
        {data.plan ? (
          <Row label={data.mode === 'RENEW' ? 'تجديد' : data.mode === 'UPGRADE' ? 'ترقية إلى' : 'الباقة'} value={`${data.plan.name} · ${data.plan.durationLabel}`} />
        ) : null}
        {needsDevice || data.device ? <Row label="الجهاز" value={device?.name ?? '—'} /> : null}
        <Row label="طريقة التواصل" value={CONTACT[contact].label} />
        <Row label="المبلغ" value={data.plan ? formatPrice(data.plan.price) : data.device ? formatPrice(data.device.price) : '—'} />
        {data.plan && device ? <Row label="سعر الجهاز" value={`+ ${formatPrice(device.price)}`} /> : null}
        <View style={styles.divider} />
        <Row label="الإجمالي" value={ready ? formatPrice(total) : '—'} strong />
        <Notice tone="info">بعد تأكيد الطلب، ستنتقل إلى حسابك لإكمال الدفع وإرسال إثبات الدفع.</Notice>
        {createOrder.isError ? <Notice tone="danger">{errorMessage(createOrder.error)}</Notice> : null}
      </Card>
    </Screen>
  );
}

function Section({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <Card style={{ gap: space.md }}>
      <View style={styles.sectionHead}>
        <View style={styles.index}>
          <Text variant="caption" weight="bold">
            {index}
          </Text>
        </View>
        <Text variant="heading">{title}</Text>
      </View>
      {children}
    </Card>
  );
}

function Row({ label, value, strong, ltr }: { label: string; value: string; strong?: boolean; ltr?: boolean }) {
  return (
    <View style={styles.row}>
      <Text color={colors.ink3}>{label}</Text>
      <Text variant={strong ? 'heading' : 'label'} style={[{ flexShrink: 1 }, ltr && { writingDirection: 'ltr' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  index: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface2,
  },
  optionSelected: { borderColor: 'rgba(34, 211, 238, 0.7)', backgroundColor: 'rgba(34, 211, 238, 0.06)' },
  contactSelected: { borderColor: colors.brand, backgroundColor: 'rgba(47,107,255,0.1)' },
  contactIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
});
