import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { destinationHref } from '@/src/lib/destinations';
import { formatDateTime } from '@/src/lib/format';
import { notificationType } from '@/src/lib/status';
import { useMarkRead, useNotifications } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { IconWell } from '@/src/ui/IconWell';
import { Screen } from '@/src/ui/Screen';
import { EmptyState, LoadingState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

/** Full text of a notification that has no specific destination. */
export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useNotifications();
  const markRead = useMarkRead();
  const item = useMemo(() => query.data?.pages.flatMap((page) => page.notifications).find((entry) => entry.id === Number(id)), [query.data, id]);

  useEffect(() => {
    if (item && !item.readAt) markRead.mutate(item.id);
    // Only when the item first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) {
    return <Screen>{query.isPending ? <LoadingState rows={1} /> : <EmptyState title="الإشعار غير موجود" icon="notifications-off-outline" />}</Screen>;
  }

  const meta = notificationType(item.type);

  return (
    <Screen>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <IconWell name={meta.icon as never} tone={meta.tone} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.ink3}>
              {meta.label} · {formatDateTime(item.createdAt)}
            </Text>
            <Text variant="heading">{item.title}</Text>
          </View>
        </View>
        {item.imageUrl ? <Image source={item.imageUrl} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md }} contentFit="cover" /> : null}
        <Text color={colors.ink2} selectable>
          {item.body}
        </Text>
      </Card>
      {item.destination ? <Button title="افتح" onPress={() => router.push(destinationHref(item.destination!) as never)} /> : null}
    </Screen>
  );
}
