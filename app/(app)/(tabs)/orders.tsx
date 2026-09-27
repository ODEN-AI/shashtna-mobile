import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/AuthProvider';
import { GuestGate } from '@/src/features/GuestGate';
import { ORDER_FILTERS, OrderCard, type OrderFilter as Filter } from '@/src/features/OrderCard';
import { useOrders } from '@/src/query/hooks';
import { AmbientBackground } from '@/src/ui/AmbientBackground';
import { Button } from '@/src/ui/Button';
import { FilterChips, type Chip } from '@/src/ui/FilterChips';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { Screen, useTabBarInset } from '@/src/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export default function OrdersScreen() {
  const signedIn = useAuth().status === 'signedIn';

  if (!signedIn) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
        <Screen edges={[]} tabBar>
          <Text variant="title">طلباتي</Text>
          <GuestGate icon="receipt" title="تابع طلباتك من هنا" body="سجّل دخولك حتى تشوف طلباتك، تدفع، وترفع إثبات الدفع وتتابع التفعيل." />
        </Screen>
      </SafeAreaView>
    );
  }

  return <MemberOrders />;
}

function MemberOrders() {
  const query = useOrders();
  const inset = useTabBarInset();
  const [filter, setFilter] = useState<Filter>('ALL');
  const orders = query.data;

  const chips = useMemo(() => {
    const list = orders ?? [];
    return (Object.keys(ORDER_FILTERS) as Filter[])
      .map((key): Chip<Filter> => ({ value: key, label: ORDER_FILTERS[key].label, count: list.filter(ORDER_FILTERS[key].test).length }))
      .filter((chip) => chip.value === 'ALL' || chip.count);
  }, [orders]);

  const visible = useMemo(() => (orders ?? []).filter(ORDER_FILTERS[filter].test), [orders, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <AmbientBackground />
      <OfflineBanner />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: inset }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        ListHeaderComponent={
          <View style={{ gap: space.lg, marginBottom: space.xs }}>
            <View style={{ gap: space.xs }}>
              <Text variant="title" accessibilityRole="header">
                طلباتي
              </Text>
              <Text color={colors.ink2}>كل طلب ومرحلته، من الدفع لحد التفعيل.</Text>
            </View>
            {chips.length > 1 ? <FilterChips items={chips} value={filter} onChange={setFilter} testID="order-filter" /> : null}
          </View>
        }
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.brandInk} colors={[colors.brand]} />}
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={
          query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : orders?.length ? (
            <EmptyState icon="funnel-outline" title="ماكو طلبات بهذا التصنيف" action={<Button title="عرض الكل" variant="glass" onPress={() => setFilter('ALL')} />} />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="ما عندك طلبات بعد"
              body="اختار باقة وكمّل طلبك بخطوات بسيطة."
              action={<Button title="تصفح الباقات" onPress={() => router.push('/packages')} />}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
