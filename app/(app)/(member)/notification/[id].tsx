import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { destinationHref } from '@/src/lib/destinations';
import { formatDateTime } from '@/src/lib/format';
import { notificationType } from '@/src/lib/status';
import { useMarkRead, useNotifications } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Panel, Pill } from '@/src/ui/Kit';
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
      <Panel style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <IconWell name={meta.icon as never} tone={meta.tone} size={48} />
          <View style={{ flex: 1, gap: 4 }}>
            <Pill label={meta.label} color={colors.brandInk} background={colors.surface2} />
            <Text variant="micro" color={colors.ink3}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
        </View>
        <Text variant="title" weight="bold">
          {item.title}
        </Text>
        {item.imageUrl ? <Image source={item.imageUrl} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md }} contentFit="cover" /> : null}
        <Text variant="body" color={colors.ink2} selectable style={{ fontSize: 16, lineHeight: 26 }}>
          {item.body}
        </Text>
      </Panel>
      {item.destination ? <Button title="افتح" iconEnd="arrow-back" onPress={() => router.push(destinationHref(item.destination!) as never)} /> : null}
    </Screen>
  );
}
