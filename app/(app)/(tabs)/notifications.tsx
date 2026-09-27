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
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.notifications) ?? [], [query.data]);
  const unread = query.data?.pages[0]?.unread ?? 0;

  const visible = useMemo(() => (filter === 'UNREAD' ? items.filter((item) => !item.readAt) : items), [items, filter]);
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
              <View style={{ flex: 1 }}>
                <Text variant="title" accessibilityRole="header">
                  الإشعارات
                </Text>
                <Text variant="caption" color={colors.ink3}>
                  {unread ? `${unread} غير مقروء` : 'كل شي مقروء'}
                </Text>
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
                ]}
                value={filter}
                onChange={setFilter}
              />
            ) : null}
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
          ) : filter === 'UNREAD' ? (
            <EmptyState icon="checkmark-done-outline" tone="success" title="ماكو إشعارات غير مقروءة" />
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
  markAll: {
    paddingHorizontal: space.md,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
