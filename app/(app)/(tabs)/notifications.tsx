import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppNotification } from '@/src/api/types';
import { destinationHref } from '@/src/lib/destinations';
import { formatRelative } from '@/src/lib/format';
import { notificationType } from '@/src/lib/status';
import { useMarkRead, useNotifications } from '@/src/query/hooks';
import { IconWell } from '@/src/ui/IconWell';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, space } from '@/src/ui/theme';

/** Notification centre — the same records as the website's notifications page. */
export default function NotificationsScreen() {
  const query = useNotifications();
  const markRead = useMarkRead();
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.notifications) ?? [], [query.data]);
  const unread = query.data?.pages[0]?.unread ?? 0;

  function open(item: AppNotification) {
    if (!item.readAt) markRead.mutate(item.id);
    router.push(item.destination ? (destinationHref(item.destination) as never) : { pathname: '/notification/[id]', params: { id: String(item.id) } });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 2, gap: space.sm }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text variant="title">الإشعارات</Text>
              {unread ? (
                <Text variant="caption" color={colors.ink3}>
                  {unread} غير مقروء
                </Text>
              ) : null}
            </View>
            {unread ? (
              <Pressable onPress={() => markRead.mutate('all')} hitSlop={hitSlop} accessibilityRole="button">
                <Text variant="label" color={colors.brandInk}>
                  تعليم الكل كمقروء
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.brandInk} colors={[colors.brand]} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.brandInk} style={{ margin: space.lg }} /> : null}
        renderItem={({ item }) => <NotificationRow item={item} onPress={() => open(item)} />}
        ListEmptyComponent={
          query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyState icon="notifications-outline" title="ماكو إشعارات" body="هنا توصلك تحديثات طلباتك واشتراكك والعروض." />
          )
        }
      />
    </SafeAreaView>
  );
}

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const meta = notificationType(item.type);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.readAt ? '' : 'غير مقروء. '}${item.title}. ${item.body}`}
      style={({ pressed }) => [styles.row, !item.readAt && styles.unread, pressed && { opacity: 0.85 }]}
    >
      <IconWell name={meta.icon as never} tone={meta.tone} size={42} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.titleRow}>
          <Text variant="label" style={{ flex: 1 }} numberOfLines={2}>
            {item.title}
          </Text>
          {!item.readAt ? <View style={styles.dot} /> : null}
        </View>
        <Text variant="caption" color={colors.ink2} numberOfLines={3}>
          {item.body}
        </Text>
        {item.imageUrl ? <Image source={item.imageUrl} style={styles.image} contentFit="cover" recyclingKey={String(item.id)} /> : null}
        <Text variant="caption" color={colors.ink3}>
          {meta.label} · {formatRelative(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  row: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  unread: { borderColor: 'rgba(34, 211, 238, 0.3)', backgroundColor: colors.surface2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.glow },
  image: { width: '100%', aspectRatio: 2, borderRadius: radius.sm, marginTop: space.xs },
});
