import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnnouncementList, OfferCarousel } from '@/src/features/ContentCards';
import { IncidentBanner } from '@/src/features/IncidentBanner';
import { NextActionCard } from '@/src/features/NextActionCard';
import { OrderCard } from '@/src/features/OrderCard';
import { PushPrompt } from '@/src/features/PushPrompt';
import { SubscriptionHero } from '@/src/features/SubscriptionHero';
import { firstName, greeting } from '@/src/lib/format';
import { useDashboard } from '@/src/query/hooks';
import { useAuth } from '@/src/auth/AuthProvider';
import { IconWell, type IconName } from '@/src/ui/IconWell';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
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
  const query = useDashboard();

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
              {data.incidents.length ? <IncidentBanner incidents={data.incidents} /> : null}

              <SubscriptionHero state={data.accountState} subscription={data.primarySubscription} order={data.currentOrder} />

              {data.nextAction && data.nextAction.kind !== 'CHOOSE_PLAN' ? (
                <NextActionCard action={data.nextAction} renewSlug={data.primarySubscription?.packageSlug} />
              ) : null}

              {data.currentOrder && data.accountState !== 'PENDING' ? (
                <Section title="طلبك الحالي" action={data.openOrdersCount > 1 ? `كل الطلبات (${data.openOrdersCount})` : undefined} onAction={() => router.push('/orders')}>
                  <OrderCard order={data.currentOrder} />
                </Section>
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
