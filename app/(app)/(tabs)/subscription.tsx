import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Loyalty, Subscription } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { GuestGate } from '@/src/features/GuestGate';
import { lookOf, renew } from '@/src/features/home/HomeSections';
import { openWeb } from '@/src/features/web/open';
import { API_BASE_URL } from '@/src/lib/config';
import { formatDate, toDate } from '@/src/lib/format';
import { useLoyalty, useSubscriptions } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Dial, Heading, Panel, Pill, Tile } from '@/src/ui/Kit';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { EmptyState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, gradients, radius, space } from '@/src/ui/theme';

const SERVICE: Record<string, string> = { IPTV: 'IPTV', VIP: 'VIP', DIGITAL: 'منصة رقمية' };

const STATE_CHIP: Record<'active' | 'expiring' | 'ended', { label: string; dot: string }> = {
  active: { label: 'شغّال', dot: colors.success },
  expiring: { label: 'قرب ينتهي', dot: colors.amber },
  ended: { label: 'منتهي', dot: colors.dangerStrong },
};

/** «اشتراكي» (Stitch subscription hub): each subscription with its dial, dates, points, and the ways to watch and renew. */
export default function SubscriptionTab() {
  const { status } = useAuth();
  const insets = useSafeAreaInsets();

  if (status !== 'signedIn') {
    return (
      <Screen edges={[]} tabBar contentStyle={[styles.content, { paddingTop: insets.top + space.lg }]}>
        <Text variant="title" weight="bold" accessibilityRole="header">
          اشتراكي
        </Text>
        <GuestGate icon="tv-outline" title="اشتراكك يظهر هنا" body="سجّل دخولك حتى تشوف اشتراكك، كم يوم باقي، وبيانات التشغيل." />
      </Screen>
    );
  }

  return <MySubscriptions />;
}

function MySubscriptions() {
  const insets = useSafeAreaInsets();
  const query = useSubscriptions();
  const loyalty = useLoyalty();

  return (
    <Screen
      edges={[]}
      tabBar
      contentStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
      refreshing={query.isRefetching}
      onRefresh={() => {
        void query.refetch();
        void loyalty.refetch();
      }}
    >
      <Text variant="title" weight="bold" accessibilityRole="header">
        اشتراكي
      </Text>

      <QueryBoundary query={query} rows={2} variant="hero">
        {(list) => {
          if (!list.length) {
            return (
              <EmptyState
                icon="tv-outline"
                title="ما عندك اشتراكات بعد"
                body="بعد ما يتفعّل طلبك، يظهر اشتراكك هنا ويا كم يوم باقي وبيانات التشغيل."
                action={<Button title="تصفح الباقات" onPress={() => router.navigate('/packages')} />}
              />
            );
          }

          const [main, ...others] = [...list].sort((a, b) => rank(a) - rank(b));

          return (
            <>
              <Hub subscription={main} loyalty={loyalty.data} />

              <Button title="شاهد الآن عبر Shashtna Player" icon="play-circle-outline" variant="glow" onPress={() => void Linking.openURL(`${API_BASE_URL}/apps`).catch(() => undefined)} />
              <View style={styles.pair}>
                <Button
                  title={lookOf(main) === 'ended' ? 'رجّع اشتراكك' : 'تجديد'}
                  icon="flash-outline"
                  variant="glass"
                  color={colors.amber}
                  onPress={() => renew(main)}
                  style={styles.flex}
                  testID="subscription-renew"
                />
                <Button title="بيانات التشغيل" icon="key-outline" variant="glass" onPress={() => router.push(`/subscriptions/${main.id}`)} style={styles.flex} testID="subscription-credentials" />
              </View>

              {others.length ? (
                <View style={styles.section}>
                  <Heading title="اشتراكاتي الثانية" />
                  {others.map((subscription) => (
                    <OtherRow key={subscription.id} subscription={subscription} />
                  ))}
                </View>
              ) : null}

              <Panel onPress={() => router.push('/orders')} style={styles.ordersLink} accessibilityLabel="طلباتي">
                <Tile icon="receipt-long" color={colors.sky} size={36} />
                <View style={styles.flex}>
                  <Text variant="label" weight="semibold">
                    طلباتي
                  </Text>
                  <Text variant="caption" color={colors.ink2}>
                    كل طلباتك وحالة كل وحدة
                  </Text>
                </View>
                <MaterialIcons name="chevron-left" size={22} color={colors.ink2} />
              </Panel>
            </>
          );
        }}
      </QueryBoundary>
    </Screen>
  );
}

/** Active first, then expiring, then the rest; the one ending soonest first within each. */
function rank(subscription: Subscription) {
  const look = lookOf(subscription);
  return (look === 'ended' ? 2000 : 0) + Math.max(0, subscription.daysRemaining);
}

function totalDays(subscription: Subscription) {
  const start = toDate(subscription.startDate)?.getTime();
  const end = toDate(subscription.expiryDate)?.getTime();
  return start && end && end > start ? Math.round((end - start) / 86_400_000) : null;
}

function Hub({ subscription, loyalty }: { subscription: Subscription; loyalty: Loyalty | undefined }) {
  const look = lookOf(subscription);
  const chip = STATE_CHIP[look];
  const days = Math.max(0, subscription.daysRemaining);
  const total = totalDays(subscription);
  const used = total !== null ? Math.max(0, total - days) : null;
  const share = look === 'ended' ? 0 : subscription.remainingFraction;

  return (
    <Panel style={styles.hub} testID="subscription-card">
      <View style={styles.between}>
        <View style={styles.flex}>
          <Text variant="micro" color={colors.ink2}>
            الباقة الحالية · {SERVICE[subscription.serviceType] ?? subscription.serviceType}
          </Text>
          <Text variant="heading" weight="semibold" numberOfLines={2}>
            {subscription.packageName}
          </Text>
        </View>
        <Pill label={chip.label} dot={chip.dot} color={colors.ink} background={colors.canvasDeep} />
      </View>

      <View style={styles.meter}>
        <Dial size={80} stroke={6} fraction={share} color={look === 'expiring' ? colors.amber : colors.brand}>
          <Text variant="title" weight="bold" style={styles.dialNumber}>
            {days}
          </Text>
          <Text variant="micro" color={colors.ink2}>
            يوم
          </Text>
        </Dial>
        <View style={[styles.flex, { gap: space.xs }]}>
          <View style={styles.between}>
            <Text variant="caption" color={colors.ink2}>
              الأيام المتبقية:
            </Text>
            <Text variant="micro" color={look === 'ended' ? colors.danger : colors.amber} style={{ fontSize: 12 }}>
              {look === 'ended' ? 'انتهى' : `باقي ${days} يوم`}
            </Text>
          </View>
          <View style={styles.between}>
            <Text variant="caption" color={colors.ink2}>
              {look === 'ended' ? 'انتهى بتاريخ:' : 'ينتهي بتاريخ:'}
            </Text>
            <Text variant="micro" color={colors.ink} style={[styles.nums, { fontSize: 12 }]}>
              {formatDate(subscription.expiryDate)}
            </Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round((1 - share) * 100)}%`, experimental_backgroundImage: `linear-gradient(270deg, ${gradients.dial[1]}, ${gradients.dial[0]})` }]} />
          </View>
          {used !== null ? (
            <Text variant="micro" color={colors.ink3}>
              تم استهلاك {used} يوم من {total}
            </Text>
          ) : null}
        </View>
      </View>

      {loyalty?.enabled ? (
        <Pressable onPress={() => openWeb('/points', 'نقاط شاشتنا')} accessibilityRole="button" style={styles.points}>
          <Tile icon="stars" color={colors.amber} size={36} />
          <View style={styles.flex}>
            <Text variant="label" weight="semibold">
              {loyalty.balance.toLocaleString('en-US')} نقطة 🎁
            </Text>
            <Text variant="micro" color={colors.amber} numberOfLines={2}>
              {loyalty.progress.messageAr}
            </Text>
          </View>
          <Pill label="المكافآت" color={colors.amber} background="rgba(255, 185, 95, 0.15)" />
        </Pressable>
      ) : null}
    </Panel>
  );
}

function OtherRow({ subscription }: { subscription: Subscription }) {
  const look = lookOf(subscription);
  const chip = STATE_CHIP[look];

  return (
    <Panel onPress={() => router.push(`/subscriptions/${subscription.id}`)} accessibilityLabel={subscription.packageName} style={styles.other}>
      <Dial size={44} stroke={4} fraction={look === 'ended' ? 0 : subscription.remainingFraction} color={look === 'expiring' ? colors.amber : colors.brand}>
        <Text variant="micro" weight="bold">
          {Math.max(0, subscription.daysRemaining)}
        </Text>
      </Dial>
      <View style={styles.flex}>
        <Text variant="label" weight="semibold" numberOfLines={1}>
          {subscription.packageName}
        </Text>
        <Text variant="caption" color={colors.ink2}>
          {look === 'ended' ? 'انتهى' : 'ينتهي'} {formatDate(subscription.expiryDate)}
        </Text>
      </View>
      <Pill label={chip.label} dot={chip.dot} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, gap: space.lg },
  section: { gap: space.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  hub: { gap: space.lg },
  meter: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.sm, backgroundColor: colors.surfaceLow },
  dialNumber: { lineHeight: 26, fontVariant: ['tabular-nums'] },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.surface3, overflow: 'hidden', marginTop: space.xs },
  barFill: { height: '100%', borderRadius: 3 },
  points: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.sm, backgroundColor: colors.surface2 },
  pair: { flexDirection: 'row', gap: space.md },
  other: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ordersLink: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
