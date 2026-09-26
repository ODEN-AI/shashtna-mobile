import { router } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderCard } from '@/src/features/OrderCard';
import { useOrders } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export default function OrdersScreen() {
  const query = useOrders();
  const orders = query.data ?? [];
  const open = orders.filter((order) => order.isOpen);
  const past = orders.filter((order) => !order.isOpen);
  const rows = [
    ...(open.length ? [{ key: 'h-open', title: 'قيد التنفيذ' } as const, ...open] : []),
    ...(past.length ? [{ key: 'h-past', title: 'السابقة' } as const, ...past] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <OfflineBanner />
      <FlatList
        data={rows}
        keyExtractor={(item) => ('key' in item ? item.key : String(item.id))}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 }}
        ListHeaderComponent={<Text variant="title">طلباتي</Text>}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.brandInk} colors={[colors.brand]} />}
        renderItem={({ item }) =>
          'key' in item ? (
            <Text variant="label" color={colors.ink3} style={{ marginTop: space.sm }}>
              {item.title}
            </Text>
          ) : (
            <OrderCard order={item} />
          )
        }
        ListEmptyComponent={
          query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <View>
              <EmptyState
                icon="receipt-outline"
                title="ما عندك طلبات بعد"
                body="اختار باقة وكمّل طلبك بخطوات بسيطة."
                action={<Button title="تصفح الباقات" onPress={() => router.push('/packages')} />}
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
