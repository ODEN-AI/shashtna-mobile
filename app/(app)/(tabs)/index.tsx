import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnnouncementList, OfferCarousel } from '@/src/features/ContentCards';
import { IncidentBanner } from '@/src/features/IncidentBanner';
import { NextActionCard } from '@/src/features/NextActionCard';
import { PushPrompt } from '@/src/features/PushPrompt';
import { SubscriptionHero } from '@/src/features/SubscriptionHero';
import { TrackedOrderCard } from '@/src/features/TrackedOrderCard';
import { firstName, greeting } from '@/src/lib/format';
import { useDashboard } from '@/src/query/hooks';
import { useAuth } from '@/src/auth/AuthProvider';
import { IconWell, type IconName } from '@/src/ui/IconWell';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, space, type Tone } from '@/src/ui/theme';

const QUICK_ACTIONS: { label: string; icon: IconName; tone: Tone; href: string }[] = [
  { label: 'الباقات', icon: 'sparkles-outline', tone: 'glow', href: '/packages' },
  { label: 'اشتراكاتي', icon: 'tv-outline', tone: 'brand', href: '/subscriptions' },
  { label: 'الدعم', icon: 'headset-outline', tone: 'info', href: '/support' },
  { label: 'حالة الخدمة', icon: 'pulse-outline', tone: 'success', href: '/status' },
];

/**
 * Home: "شنو وضعي الحالي؟ عندي طلب؟ شنو لازم أسوي؟ شنو الجديد؟" — all
 * from one /api/mobile/dashboard call, cached for instant start.
 */
export default function DashboardScreen() {
  const { user } = useAuth();
  // Arriving from checkout: /?order=<id>&created=1 (same as the website).
  const params = useLocalSearchParams<{ order?: string; created?: string }>();
  const highlight = Number(params.order) || null;
  const query = useDashboard(highlight);
  const justCreated = Boolean(highlight) && params.created === '1' && query.data?.currentOrder?.id === highlight;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()} edges={[]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.ink3}>
              {greeting()}
            </Text>
            <Text variant="title" numberOfLines={1}>
              {firstName(query.data?.user.name ?? user?.name ?? '')} 👋
            </Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="الإشعارات" style={styles.bell}>
            <Ionicons name="notifications-outline" size={24} color={colors.ink} />
            {query.data?.unreadNotifications ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        <QueryBoundary query={query} rows={4}>
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

              <PushPrompt />

              <View style={styles.quick}>
                {QUICK_ACTIONS.map((action) => (
                  <Pressable
                    key={action.href}
                    onPress={() => router.push(action.href as never)}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.8 }]}
                  >
                    <IconWell name={action.icon} tone={action.tone} size={46} />
                    <Text variant="caption" center color={colors.ink2}>
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {data.offers.length ? (
                <Section title="العروض" action="الكل" onAction={() => router.push('/packages')}>
                  <OfferCarousel items={data.offers} />
                </Section>
              ) : null}

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
  bell: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 11, end: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.glow },
  quick: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: space.sm, flex: 1 },
});
