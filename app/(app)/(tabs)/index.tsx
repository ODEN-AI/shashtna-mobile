import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Dashboard } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { useRequireAuth } from '@/src/auth/useRequireAuth';
import { AnnouncementList } from '@/src/features/ContentCards';
import { IncidentBanner } from '@/src/features/IncidentBanner';
import { NextActionCard } from '@/src/features/NextActionCard';
import { PushPrompt } from '@/src/features/PushPrompt';
import { QuickActions, type QuickAction } from '@/src/features/QuickActions';
import { MemberSpotlight, PromoSpotlight } from '@/src/features/spotlight/Spotlight';
import { SubscriptionHero } from '@/src/features/SubscriptionHero';
import { TrackedOrderCard } from '@/src/features/TrackedOrderCard';
import { firstName, greeting } from '@/src/lib/format';
import { useCatalog, useContent, useDashboard, useServiceStatus } from '@/src/query/hooks';
import { BrandMark } from '@/src/ui/BrandMark';
import { Button } from '@/src/ui/Button';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { ErrorState, LoadingState, Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, gradients, hitSlop, radius, space } from '@/src/ui/theme';

export default function HomeScreen() {
  const { status } = useAuth();
  return status === 'signedIn' ? <CustomerHome /> : <GuestHome />;
}

function useOpenAction() {
  const { go } = useRequireAuth();
  return (action: QuickAction) => (action.requiresAuth ? go(action.href) : router.push(action.href));
}

// -------------------------------------------------------------------- guest

const GUEST_ACTIONS: QuickAction[] = [
  { key: 'packages', label: 'الباقات', icon: 'sparkles', href: '/packages' },
  { key: 'support', label: 'الدعم', icon: 'headset-outline', href: '/support' },
  { key: 'status', label: 'حالة الخدمة', icon: 'pulse-outline', href: '/status' },
];

/** Guest Home: browse packages, offers and news without an account. */
function GuestHome() {
  const catalog = useCatalog();
  const content = useContent();
  const status = useServiceStatus();
  const open = useOpenAction();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen
        edges={[]}
        tabBar
        refreshing={catalog.isRefetching || content.isRefetching}
        onRefresh={() => {
          void catalog.refetch();
          void content.refetch();
          void status.refetch();
        }}
      >
        <View style={styles.header}>
          <BrandMark size={44} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.ink3}>
              {greeting()}
            </Text>
            <Text variant="heading">شاشتنا</Text>
          </View>
          <Button title="دخول" variant="glass" compact icon="person-circle-outline" onPress={() => router.push('/login')} testID="guest-login" />
        </View>

        <GradientSurface stops={gradients.hero} style={styles.welcome} testID="guest-welcome">
          <Text variant="caption" weight="bold" color={colors.ice}>
            تتصفح كضيف
          </Text>
          <Text variant="title">كل باقات شاشتنا بين إيدك</Text>
          <Text color={colors.ice}>تصفح الباقات والعروض بدون حساب. سجّل دخولك لما تريد تطلب وتتابع اشتراكك.</Text>
          <View style={styles.welcomeActions}>
            <Button title="إنشاء حساب" variant="light" compact onPress={() => router.push('/register')} style={{ flex: 1 }} testID="guest-register" />
            <Button title="تصفح الباقات" variant="glass" compact onPress={() => router.push('/packages')} style={{ flex: 1 }} />
          </View>
        </GradientSurface>

        {status.data?.active.length ? <IncidentBanner incidents={status.data.active} /> : null}

        <PromoSpotlight offers={content.data?.offers} catalog={catalog.data} />

        <QuickActions items={GUEST_ACTIONS} onOpen={open} />

        {content.data?.announcements.length ? (
          <Section title="الجديد من شاشتنا">
            <AnnouncementList items={content.data.announcements.slice(0, 3)} />
          </Section>
        ) : null}

        {catalog.isPending && content.isPending ? <LoadingState rows={2} /> : null}
        {catalog.isError && !catalog.data ? (
          <ErrorState
            error={catalog.error}
            onRetry={() => {
              void catalog.refetch();
              void content.refetch();
            }}
          />
        ) : null}
      </Screen>
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------- customer

function customerActions(data: Dashboard | undefined): QuickAction[] {
  return [
    { key: 'packages', label: 'الباقات', icon: 'sparkles', href: '/packages' },
    { key: 'orders', label: 'طلباتي', icon: 'receipt-outline', href: '/orders', badge: data?.openOrdersCount || undefined },
    { key: 'notifications', label: 'الإشعارات', icon: 'notifications-outline', href: '/notifications', badge: data?.unreadNotifications || undefined },
    { key: 'support', label: 'الدعم', icon: 'headset-outline', href: '/support' },
    { key: 'status', label: 'حالة الخدمة', icon: 'pulse-outline', href: '/status' },
    { key: 'account', label: 'حسابي', icon: 'person-circle-outline', href: '/account' },
  ];
}

/**
 * Customer Home: header → subscription hero → current order / next step →
 * spotlight (member or promotional by state) → quick actions → news.
 * All from one /api/mobile/dashboard call, cached for an instant start.
 */
function CustomerHome() {
  const { user } = useAuth();
  // Arriving from checkout: /?order=<id>&created=1 (same as the website).
  const params = useLocalSearchParams<{ order?: string; created?: string }>();
  const highlight = Number(params.order) || null;
  const query = useDashboard(highlight);
  const catalog = useCatalog();
  const open = useOpenAction();
  const justCreated = Boolean(highlight) && params.created === '1' && query.data?.currentOrder?.id === highlight;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen edges={[]} tabBar refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text variant="heading" color="#FFFFFF">
              {(query.data?.user.name ?? user?.name ?? '').trim().charAt(0) || '؟'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.ink3}>
              {greeting()}
            </Text>
            <Text variant="heading" numberOfLines={1}>
              {firstName(query.data?.user.name ?? user?.name ?? '')}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="الإشعارات" style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            {query.data?.unreadNotifications ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        <QueryBoundary query={query} rows={3} variant="hero">
          {(data) => (
            <>
              {justCreated ? (
                <Notice tone="success" icon="checkmark-circle">
                  {data.currentOrder?.stage === 'PAYMENT_PENDING' ? 'تم إنشاء طلبك ✅ الخطوة التالية: إتمام الدفع' : 'تم إنشاء طلبك ✅ تكدر تتابعه من هنا.'}
                </Notice>
              ) : null}

              {data.incidents.length ? <IncidentBanner incidents={data.incidents} /> : null}

              <SubscriptionHero state={data.accountState} subscription={data.primarySubscription} order={data.currentOrder} />

              {data.currentOrder ? (
                <TrackedOrderCard order={data.currentOrder} />
              ) : data.nextAction && data.nextAction.kind !== 'CHOOSE_PLAN' ? (
                <NextActionCard action={data.nextAction} renewSlug={data.primarySubscription?.packageSlug} />
              ) : null}

              {data.accountState === 'ACTIVE' || data.accountState === 'EXPIRING' ? (
                <MemberSpotlight dashboard={data} catalog={catalog.data} />
              ) : data.accountState !== 'PENDING' ? (
                <PromoSpotlight offers={data.offers} catalog={catalog.data} />
              ) : null}

              <PushPrompt />

              <Section title="وصول سريع">
                <QuickActions items={customerActions(data)} onOpen={open} />
              </Section>

              {data.announcements.length ? (
                <Section title="الجديد من شاشتنا">
                  <AnnouncementList items={data.announcements} />
                </Section>
              ) : null}
            </>
          )}
        </QueryBoundary>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.glassEdge,
  },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: { position: 'absolute', top: 11, end: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ice },
  welcome: { padding: space.xl, gap: space.sm, borderRadius: radius.xxl },
  welcomeActions: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
});
