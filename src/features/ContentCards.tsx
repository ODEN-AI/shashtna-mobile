import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { ContentItem } from '@/src/api/types';
import { formatDate } from '@/src/lib/format';
import { Badge } from '@/src/ui/Badge';
import { Card } from '@/src/ui/Card';
import { IconWell } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

/** Offers from the backend (Announcement records of kind AD). */
export function OfferCarousel({ items }: { items: ContentItem[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(340, width - space.lg * 2 - 36);

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => String(item.id)}
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + space.md}
      decelerationRate="fast"
      contentContainerStyle={{ gap: space.md }}
      renderItem={({ item }) => (
        <Card onPress={() => router.push(`/content/${item.id}`)} style={[styles.offer, { width: cardWidth }]} accessibilityLabel={item.title} glow>
          {item.imageUrl ? (
            <Image source={item.imageUrl} style={styles.image} contentFit="cover" transition={200} cachePolicy="memory-disk" />
          ) : null}
          <View style={styles.offerBody}>
            <Badge label="عرض" tone="glow" />
            <Text variant="heading" numberOfLines={2}>
              {item.title}
            </Text>
            {item.description ? (
              <Text variant="caption" color={colors.ink2} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {item.endsAt ? (
              <Text variant="caption" color={colors.warning}>
                لغاية {formatDate(item.endsAt)}
              </Text>
            ) : null}
          </View>
        </Card>
      )}
    />
  );
}

/** News / announcements (kind ANNOUNCEMENT). */
export function AnnouncementList({ items }: { items: ContentItem[] }) {
  return (
    <View style={{ gap: space.md }}>
      {items.map((item) => (
        <Card key={item.id} onPress={() => router.push(`/content/${item.id}`)} style={styles.row} accessibilityLabel={item.title}>
          <IconWell name="megaphone-outline" tone={item.style === 'WARNING' ? 'warning' : 'glow'} size={40} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" numberOfLines={2}>
              {item.title}
            </Text>
            {item.description ? (
              <Text variant="caption" color={colors.ink2} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  offer: { padding: 0 },
  image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface2 },
  offerBody: { padding: space.lg, gap: space.sm },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md, borderRadius: radius.md },
});
