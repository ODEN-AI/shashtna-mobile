import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppNotification } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { GuestGate } from '@/src/features/GuestGate';
import { FeaturedNotification, NotificationCard } from '@/src/features/NotificationCard';
import { destinationHref } from '@/src/lib/destinations';
import { useMarkRead, useNotifications } from '@/src/query/hooks';
import { AmbientBackground } from '@/src/ui/AmbientBackground';
import { FilterChips } from '@/src/ui/FilterChips';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { Screen, useTabBarInset } from '@/src/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, space } from '@/src/ui/theme';

export default function NotificationsScreen() {
  const signedIn = useAuth().status === 'signedIn';

  if (!signedIn) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
        <Screen edges={[]} tabBar>
          <Text variant="title">الإشعارات</Text>
          <GuestGate icon="notifications" title="خليك على اطلاع" body="سجّل دخولك حتى توصلك تحديثات طلبك وتفعيل اشتراكك وردود الدعم والعروض." />
        </Screen>
      </SafeAreaView>
    );
  }

  return <NotificationCentre />;
}

/** Notification centre — the same records as the website's notifications page. */
function NotificationCentre() {
  const query = useNotifications();
  const markRead = useMarkRead();
  const inset = useTabBarInset();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'OFFERS' | 'ORDERS'>('ALL');
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.notifications) ?? [], [query.data]);
  const unread = query.data?.pages[0]?.unread ?? 0;

  const visible = useMemo(
    () =>
      items.filter((item) =>
        filter === 'UNREAD'
          ? !item.readAt
          : filter === 'OFFERS'
            ? item.type === 'OFFER' || item.type === 'ANNOUNCEMENT'
            : filter === 'ORDERS'
              ? ['ORDER_STATUS', 'PAYMENT_UPDATE', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_RENEWED'].includes(item.type)
              : true,
      ),
    [items, filter],
  );
  // The newest unread item is featured; everything else is a compact card.
  const featured = visible.find((item) => !item.readAt) ?? null;
  const rest = useMemo(() => (featured ? visible.filter((item) => item.id !== featured.id) : visible), [visible, featured]);

  function open(item: AppNotification) {
    if (!item.readAt) markRead.mutate(item.id);
    router.push(item.destination ? (destinationHref(item.destination) as never) : { pathname: '/notification/[id]', params: { id: String(item.id) } });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <AmbientBackground />
      <OfflineBanner />
      <FlatList
        data={rest}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: space.lg, paddingBottom: inset, gap: space.sm }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
        ListHeaderComponent={
          <View style={{ gap: space.lg, marginBottom: space.sm }}>
            <View style={styles.header}>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.titleRow}>
                  <View style={styles.liveDot} />
                  <Text variant="title" weight="bold" accessibilityRole="header">
                    مركز الإشعارات والعروض
                  </Text>
                </View>
                <View style={styles.counter}>
                  <Text variant="micro" color={unread ? colors.amber : colors.ink2}>
                    {unread ? `${unread} غير مقروءة` : 'كل شي مقروء'}
                  </Text>
                </View>
              </View>
              {unread ? (
                <Pressable onPress={() => markRead.mutate('all')} hitSlop={hitSlop} accessibilityRole="button" style={styles.markAll} testID="mark-all-read">
                  <Text variant="label" color={colors.brandInk}>
                    تعليم الكل كمقروء
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {items.length ? (
              <FilterChips
                items={[
                  { value: 'ALL', label: 'الكل' },
                  { value: 'UNREAD', label: 'غير مقروءة', count: unread || undefined },
                  { value: 'OFFERS', label: 'العروض والإعلانات' },
                  { value: 'ORDERS', label: 'طلباتي واشتراكي' },
                ]}
                value={filter}
                onChange={setFilter}
              />
            ) : null}
            <Pressable onPress={() => router.push('/offers')} accessibilityRole="button" style={styles.offersLink} testID="open-offers">
              <Text variant="label" weight="semibold" color={colors.amber}>
                عروض وأخبار شاشتنا
              </Text>
              <Text variant="micro" color={colors.ink2}>
                كل العروض والأخبار الحالية ←
              </Text>
            </Pressable>
            {featured ? <FeaturedNotification item={featured} onPress={() => open(featured)} /> : null}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.brandInk} colors={[colors.brand]} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.brandInk} style={{ margin: space.lg }} /> : null}
        renderItem={({ item }) => <NotificationCard item={item} onPress={() => open(item)} />}
        ListEmptyComponent={
          featured ? null : query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : filter !== 'ALL' ? (
            <EmptyState icon="checkmark-done-outline" tone="success" title={filter === 'UNREAD' ? 'ماكو إشعارات غير مقروءة' : 'ماكو شي هنا بعد'} />
          ) : (
            <EmptyState icon="notifications-outline" title="ماكو إشعارات" body="هنا توصلك تحديثات طلباتك واشتراكك والعروض." />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.amber },
  counter: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface2 },
  offersLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: space.lg, borderRadius: radius.xl, backgroundColor: colors.surface },
  markAll: { paddingHorizontal: space.md, minHeight: 44, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surface2 },
});
