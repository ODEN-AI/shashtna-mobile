import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/src/api/client';
import type { RequestType } from '@/src/api/types';
import { monthly } from '@/src/features/PackageCard';
import { formatPrice } from '@/src/lib/format';
import { useCatalog, useCreateOrder } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { Field } from '@/src/ui/Field';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { EmptyState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, radius, space } from '@/src/ui/theme';

const TYPE_TITLE: Record<RequestType, string> = {
  NEW: 'اشتراك جديد',
  RENEW: 'تجديد الاشتراك',
  UPGRADE: 'ترقية الاشتراك',
  DEVICE_PURCHASE: 'شراء جهاز',
};

/**
 * Package details and order confirmation. The order is created by the
 * backend's order service (same as the website checkout): it prices the
 * order, checks the plan is still active and VIP device compatibility, and
 * reuses an existing unpaid order instead of duplicating it.
 */
export default function PackageScreen() {
  const params = useLocalSearchParams<{ slug: string; renew?: string; upgrade?: string }>();
  const catalog = useCatalog();
  const createOrder = useCreateOrder();
  const toast = useToast();
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);

  const requestType: RequestType = params.renew ? 'RENEW' : params.upgrade ? 'UPGRADE' : 'NEW';
  const subscriptionId = Number(params.renew ?? params.upgrade) || undefined;

  const pkg = catalog.data?.packages.find((item) => item.slug === params.slug);
  const devices = useMemo(
    () => (pkg ? (catalog.data?.devices ?? []).filter((device) => device.packageIds.includes(pkg.id)) : []),
    [catalog.data, pkg],
  );
  const needsDevice = Boolean(pkg?.requiresDevice && requestType !== 'RENEW');
  const device = devices.find((item) => item.id === deviceId) ?? null;
  const total = (pkg?.price ?? 0) + (needsDevice && device ? device.price : 0);

  async function submit() {
    if (!pkg) return;

    try {
      const result = await createOrder.mutateAsync({
        requestType,
        planSlug: pkg.slug,
        deviceId: needsDevice ? device?.id : undefined,
        subscriptionId,
        customerNote: note.trim() || undefined,
      });

      toast(result.alreadyExists ? 'عندك طلب مفتوح لنفس الباقة — حدّثناه' : 'تم إنشاء طلبك ✅');
      router.replace({ pathname: '/orders/[id]', params: { id: String(result.order.id) } });
    } catch {
      // Shown inline below.
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: pkg?.name ?? 'الباقة' }} />
      <Screen
        footer={
          pkg ? (
            confirming ? (
              <View style={{ gap: space.sm }}>
                <Button title={`تأكيد الطلب · ${formatPrice(total)}`} icon="checkmark-circle" loading={createOrder.isPending} onPress={submit} testID="confirm-order" />
                <Button title="رجوع" variant="ghost" compact onPress={() => setConfirming(false)} />
              </View>
            ) : (
              <Button
                title={requestType === 'RENEW' ? 'جدّد بهذه الباقة' : 'اطلب هذه الباقة'}
                icon="cart"
                disabled={needsDevice && !device}
                onPress={() => setConfirming(true)}
                testID="order-package"
              />
            )
          ) : null
        }
      >
        <QueryBoundary query={catalog} rows={2}>
          {() =>
            !pkg ? (
              <EmptyState icon="alert-circle-outline" tone="warning" title="هذه الباقة غير متاحة حاليًا" body="ممكن الإدارة أوقفتها أو غيّرتها. شوف الباقات المتاحة." action={<Button title="الباقات المتاحة" onPress={() => router.replace('/packages')} />} />
            ) : (
              <>
                {pkg.imageUrl ? <Image source={pkg.imageUrl} style={styles.image} contentFit="cover" transition={200} /> : null}

                <View style={{ gap: space.sm }}>
                  <View style={styles.badges}>
                    <Badge label={pkg.serviceType} tone={pkg.serviceType === 'VIP' ? 'warning' : 'brand'} />
                    {requestType !== 'NEW' ? <Badge label={TYPE_TITLE[requestType]} tone="info" /> : null}
                    {pkg.isPopular ? <Badge label="الأكثر طلبًا" tone="glow" /> : null}
                  </View>
                  <Text variant="title">{pkg.name}</Text>
                  <Text color={colors.ink2}>{pkg.description}</Text>
                </View>

                <Card style={styles.price}>
                  <View>
                    <Text variant="caption" color={colors.ink3}>
                      السعر · {pkg.durationLabel}
                    </Text>
                    <Text variant="title">{formatPrice(pkg.price)}</Text>
                  </View>
                  {monthly(pkg) ? (
                    <Text variant="caption" color={colors.ink3}>
                      ≈ {formatPrice(monthly(pkg)!)} / شهر
                    </Text>
                  ) : null}
                </Card>

                {pkg.features.length ? (
                  <Card style={{ gap: space.md }}>
                    <Text variant="heading">شنو تحصل</Text>
                    {pkg.features.map((feature) => (
                      <View key={feature} style={styles.feature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                        <Text style={{ flex: 1 }}>{feature}</Text>
                      </View>
                    ))}
                    {pkg.notes ? (
                      <Text variant="caption" color={colors.ink3}>
                        {pkg.notes}
                      </Text>
                    ) : null}
                  </Card>
                ) : null}

                {needsDevice ? (
                  <View style={{ gap: space.md }}>
                    <Text variant="heading">اختار جهاز VIP</Text>
                    {devices.length ? (
                      devices.map((item) => {
                        const selected = item.id === deviceId;

                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => setDeviceId(item.id)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            style={[styles.device, selected && styles.deviceSelected]}
                          >
                            <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.brand : colors.ink3} />
                            <View style={{ flex: 1 }}>
                              <Text variant="label">{item.name}</Text>
                              <Text variant="caption" color={colors.ink3} numberOfLines={2}>
                                {item.description}
                              </Text>
                            </View>
                            <Text variant="label">+{formatPrice(item.price)}</Text>
                          </Pressable>
                        );
                      })
                    ) : (
                      <Notice tone="warning">ماكو جهاز متوافق متاح حاليًا لهذه الباقة. تواصل ويا الدعم.</Notice>
                    )}
                  </View>
                ) : null}

                {confirming ? (
                  <Card style={{ gap: space.md }} glow>
                    <Text variant="heading">تأكيد الطلب</Text>
                    <Row label="نوع الطلب" value={TYPE_TITLE[requestType]} />
                    <Row label="الباقة" value={`${pkg.name} · ${pkg.durationLabel}`} />
                    {needsDevice && device ? <Row label="الجهاز" value={`${device.name} (+${formatPrice(device.price)})`} /> : null}
                    <Row label="المبلغ" value={formatPrice(total)} strong />
                    <Field label="ملاحظة (اختياري)" value={note} onChangeText={setNote} maxLength={500} multiline />
                    <Notice tone="info">بعد التأكيد تحوّل المبلغ وترفع صورة الإثبات من صفحة الطلب. فريقنا يراجع الدفع ويفعّل اشتراكك.</Notice>
                    {createOrder.isError ? <Notice tone="danger">{errorMessage(createOrder.error)}</Notice> : null}
                  </Card>
                ) : null}
              </>
            )
          }
        </QueryBoundary>
      </Screen>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text color={colors.ink3}>{label}</Text>
      <Text variant={strong ? 'heading' : 'label'} style={{ flexShrink: 1 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.surface2 },
  badges: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  price: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  feature: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  device: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  deviceSelected: { borderColor: colors.brand, backgroundColor: 'rgba(47,107,255,0.1)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
});
