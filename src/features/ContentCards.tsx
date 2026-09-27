import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { ContentItem } from '@/src/api/types';
import { formatDate, formatRelative } from '@/src/lib/format';
import { Badge } from '@/src/ui/Badge';
import { Card } from '@/src/ui/Card';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { IconTile } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, gradients, radius, shadow, space } from '@/src/ui/theme';

/** Offers from the backend (Announcement records of kind AD), as a snapping rail. */
export function OfferCarousel({ items }: { items: ContentItem[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(320, width - space.lg * 2 - 44);

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => String(item.id)}
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + space.md}
      decelerationRate="fast"
      contentContainerStyle={{ gap: space.md }}
      initialNumToRender={3}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/content/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`عرض: ${item.title}`}
          style={({ pressed }) => [styles.offer, { width: cardWidth }, pressed && { opacity: 0.9 }]}
        >
          {item.imageUrl ? (
            <Image source={item.imageUrl} style={styles.image} contentFit="cover" transition={200} cachePolicy="memory-disk" />
          ) : (
            <GradientSurface stops={gradients.heroDeep} style={styles.placeholder}>
              <IconTile name="pricetag" tone="glow" size={52} />
            </GradientSurface>
          )}
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
        </Pressable>
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
          {item.imageUrl ? (
            <Image source={item.imageUrl} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <IconTile name="megaphone-outline" tone={item.style === 'WARNING' ? 'warning' : 'glow'} size={44} />
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" numberOfLines={2}>
              {item.title}
            </Text>
            {item.description ? (
              <Text variant="caption" color={colors.ink2} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <Text variant="caption" color={colors.ink3}>
              {formatRelative(item.startsAt ?? item.updatedAt)}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  offer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 33, 89, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(108, 196, 255, 0.3)',
    borderTopColor: colors.glassEdge,
    boxShadow: shadow.card,
  },
  image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface2 },
  placeholder: { aspectRatio: 16 / 9, borderRadius: 0, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  offerBody: { padding: space.lg, gap: space.sm },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surface2 },
});
