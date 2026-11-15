import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, View } from 'react-native';

import { ApiError } from '@/src/api/client';
import { destinationHref } from '@/src/lib/destinations';
import { formatDate } from '@/src/lib/format';
import { useContentItem } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

/**
 * One offer / announcement. Reads the live record: once the admin edits,
 * disables or ends it on the website, this screen follows.
 */
export default function ContentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useContentItem(Number(id));
  const item = query.data;

  return (
    <>
      <Stack.Screen options={{ title: item?.kind === 'OFFER' ? 'العرض' : 'الخبر' }} />
      <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        {item ? (
          <>
            {item.imageUrl ? (
              <Image source={item.imageUrl} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: colors.surface2 }} contentFit="cover" transition={200} />
            ) : null}
            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Badge label={item.kind === 'OFFER' ? 'عرض' : 'خبر'} tone={item.kind === 'OFFER' ? 'glow' : 'info'} />
                {item.endsAt ? <Badge label={`لغاية ${formatDate(item.endsAt)}`} tone="warning" /> : null}
              </View>
              <Text variant="title" weight="bold">
                {item.title}
              </Text>
              {item.description ? (
                <Text color={colors.ink2} selectable>
                  {item.description}
                </Text>
              ) : null}
            </View>
            {item.cta?.destination ? (
              <Button title={item.cta.label} onPress={() => router.push(destinationHref(item.cta!.destination!) as never)} />
            ) : item.cta?.externalUrl ? (
              <Button title={item.cta.label} icon="open-outline" onPress={() => void Linking.openURL(item.cta!.externalUrl!)} />
            ) : null}
          </>
        ) : query.isPending ? (
          <LoadingState rows={1} />
        ) : query.error instanceof ApiError && query.error.kind === 'not_found' ? (
          <EmptyState icon="time-outline" title="هذا الإعلان انتهى" body="ما عاد متاح. شوف العروض والأخبار الحالية." action={<Button title="الرئيسية" onPress={() => router.replace('/')} />} />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </Screen>
    </>
  );
}
