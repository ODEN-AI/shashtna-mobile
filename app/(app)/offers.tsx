import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ContentCard } from '@/src/features/ContentCard';
import { useContent } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { FilterChips } from '@/src/ui/FilterChips';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { EmptyState } from '@/src/ui/States';
import { space } from '@/src/ui/theme';

type Filter = 'ALL' | 'OFFER' | 'ANNOUNCEMENT';

/**
 * «العروض والأخبار»: every live offer and announcement from Admin → Content,
 * open to guests. An item the admin ends or disables disappears here too.
 */
export default function OffersScreen() {
  const query = useContent();
  const [filter, setFilter] = useState<Filter>('ALL');
  const data = query.data;

  const chips = useMemo(
    () => [
      { value: 'ALL' as const, label: 'الكل', count: (data?.offers.length ?? 0) + (data?.announcements.length ?? 0) || undefined },
      { value: 'OFFER' as const, label: 'العروض', count: data?.offers.length || undefined },
      { value: 'ANNOUNCEMENT' as const, label: 'الأخبار', count: data?.announcements.length || undefined },
    ],
    [data],
  );

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()} contentStyle={styles.content}>
      <QueryBoundary query={query} rows={3}>
        {(content) => {
          const items = [...(filter === 'ANNOUNCEMENT' ? [] : content.offers), ...(filter === 'OFFER' ? [] : content.announcements)];

          return (
            <>
              {content.offers.length && content.announcements.length ? <FilterChips items={chips} value={filter} onChange={setFilter} testID="content-filter" /> : null}
              {items.length ? (
                <View style={styles.list} testID="offers-list">
                  {items.map((item, index) => (
                    <ContentCard key={item.id} item={item} large={index === 0} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="pricetag-outline"
                  title="ماكو عروض أو أخبار هسه"
                  body="أول ما ننزل عرض أو خبر جديد يظهر هنا."
                  action={<Button title="تصفح الباقات" onPress={() => router.navigate('/packages')} />}
                />
              )}
            </>
          );
        }}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  list: { gap: space.md },
});
