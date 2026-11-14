import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Dashboard } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { EmptyCard, SubscriptionCard, cardLook } from '@/src/features/card/SubscriptionCard';
import { OrderTrack } from '@/src/features/card/OrderTrack';
import { IncidentBanner } from '@/src/features/IncidentBanner';
import { PushPrompt } from '@/src/features/PushPrompt';
import { openWeb } from '@/src/features/web/open';
import { firstName, greeting } from '@/src/lib/format';
import { useDashboard, useServiceStatus } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, space } from '@/src/ui/theme';

/** «اشتراكي»: the card in hand, one big renew button, and the order being followed. */
export default function HomeScreen() {
  const { status } = useAuth();
  return status === 'signedIn' ? <CustomerHome /> : <GuestHome />;
}

const openStore = () => router.navigate('/store');

function Header({ name, unread }: { name?: string; unread?: number }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text variant="caption" color={colors.ink3}>
          {greeting()}
        </Text>
        <Text variant="title" numberOfLines={1}>
          {name ? firstName(name) : 'شاشتنا'}
        </Text>
      </View>
      {name !== undefined ? (
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={unread ? `الإشعارات، ${unread} جديدة` : 'الإشعارات'}
          style={styles.bell}
          testID="home-bell"
        >
          <Ionicons name="notifications-outline" size={24} color={colors.ink} />
          {unread ? <View style={styles.bellDot} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

// -------------------------------------------------------------------- guest

function GuestHome() {
  const insets = useSafeAreaInsets();
  const status = useServiceStatus();

  return (
    <Screen edges={[]} tabBar contentStyle={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.xl }} refreshing={status.isRefetching} onRefresh={() => void status.refetch()}>
      <Header />
      {status.data?.active.length ? <IncidentBanner incidents={status.data.active} /> : null}
      <EmptyCard title="اشتراكك يصير هنا" body="اختار باقتك، وبعد التفعيل تشوف كم يوم باقي وتجدد بضغطة." />
      <Button title="تصفح الباقات" size="lg" onPress={openStore} testID="guest-store" />
      <View style={styles.pair}>
        <Button title="تسجيل الدخول" variant="secondary" onPress={() => router.push('/login')} style={{ flex: 1 }} testID="guest-login" />
        <Button title="حساب جديد" variant="ghost" onPress={() => router.push('/register')} style={{ flex: 1 }} testID="guest-register" />
      </View>
    </Screen>
  );
}

// ----------------------------------------------------------------- customer

function renewTitle(data: Dashboard) {
  const sub = data.primarySubscription;
  if (!sub) return 'اختار باقتك';
  return cardLook(sub) === 'ended' ? 'رجّع اشتراكك' : 'جدّد اشتراكك';
}

function CustomerHome() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  // Arriving from checkout: /?order=<id>&created=1 (same as the website).
  const params = useLocalSearchParams<{ order?: string; created?: string }>();
  const highlight = Number(params.order) || null;
  const query = useDashboard(highlight);
  const justCreated = Boolean(highlight) && params.created === '1' && query.data?.currentOrder?.id === highlight;

  return (
    <Screen edges={[]} tabBar contentStyle={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.xl }} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Header name={query.data?.user.name ?? user?.name ?? ''} unread={query.data?.unreadNotifications} />

      <QueryBoundary query={query} rows={3} variant="hero">
        {(data) => {
          const sub = data.primarySubscription;
          const order = data.currentOrder;
          const renewing = Boolean(order?.isOpen && (order.requestType === 'RENEW' || order.needsPayment));

          return (
            <>
              {justCreated ? (
                <Notice tone="success" icon="checkmark-circle">
                  {order?.needsPayment ? 'وصلنا طلبك. الخطوة الجاية: حوّل المبلغ وارفع صورة الحوالة.' : 'وصلنا طلبك. تكدر تتابعه من هنا.'}
                </Notice>
              ) : null}

              {data.incidents.length ? <IncidentBanner incidents={data.incidents} /> : null}

              {sub ? (
                <SubscriptionCard subscription={sub} onPress={() => router.push(`/subscriptions/${sub.id}`)} />
              ) : (
                <EmptyCard
                  title="ما عندك اشتراك بعد"
                  body={order?.isOpen ? 'طلبك بالطريق. أول ما نفعّله تظهر بطاقتك هنا.' : 'اختار باقتك من المتجر وبطاقتك تظهر هنا.'}
                />
              )}

              {data.subscriptionsCount > 1 ? (
                <Pressable onPress={() => router.push('/subscriptions')} accessibilityRole="button" style={styles.more} hitSlop={hitSlop}>
                  <Text variant="label" color={colors.brandInk}>
                    عندك {data.subscriptionsCount} اشتراكات · شوفها كلها
                  </Text>
                </Pressable>
              ) : null}

              {!renewing ? (
                <Button
                  title={renewTitle(data)}
                  size="lg"
                  variant="light"
                  icon={sub ? 'refresh' : 'bag-handle-outline'}
                  onPress={() => (sub && sub.canRenew ? openWeb(`/checkout?renew=${sub.id}`, 'تجديد الاشتراك') : openStore())}
                  testID="home-renew"
                />
              ) : null}

              {order && order.isOpen ? <OrderTrack order={order} /> : null}

              <PushPrompt />
            </>
          );
        }}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bell: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  bellDot: { position: 'absolute', top: 12, end: 13, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.brandInk },
  pair: { flexDirection: 'row', gap: space.md },
  more: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
});
