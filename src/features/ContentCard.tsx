import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ContentItem } from '@/src/api/types';
import { formatDate } from '@/src/lib/format';
import { Panel, Pill } from '@/src/ui/Kit';
import { Text } from '@/src/ui/Text';
import { colors, radius, rgba, space } from '@/src/ui/theme';

const KIND = {
  OFFER: { label: 'عرض', icon: 'local-offer', color: colors.amber },
  ANNOUNCEMENT: { label: 'خبر', icon: 'campaign', color: colors.sky },
} as const;

/** An offer or announcement from Admin → Content (Stitch announcements card). Opens the live record. */
export const ContentCard = memo(function ContentCard({ item, large }: { item: ContentItem; large?: boolean }) {
  const kind = KIND[item.kind] ?? KIND.ANNOUNCEMENT;

  return (
    <Panel onPress={() => router.push(`/content/${item.id}`)} accessibilityLabel={`${kind.label}: ${item.title}`} style={styles.card} testID={`content-${item.id}`}>
      {item.imageUrl && large ? (
        <View>
          <Image source={item.imageUrl} style={styles.image} contentFit="cover" recyclingKey={`content-${item.id}`} />
          <View style={[styles.tag, { backgroundColor: kind.color }]}>
            <MaterialIcons name={kind.icon} size={14} color={colors.inkOnLight} />
            <Text variant="micro" color={colors.inkOnLight}>
              {kind.label}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={[styles.body, !large && styles.row]}>
        {!large ? (
          item.imageUrl ? (
            <Image source={item.imageUrl} style={styles.thumb} contentFit="cover" recyclingKey={`content-thumb-${item.id}`} />
          ) : (
            <View style={[styles.icon, { backgroundColor: rgba(kind.color, 0.14) }]}>
              <MaterialIcons name={kind.icon} size={22} color={kind.color} />
            </View>
          )
        ) : null}
        <View style={styles.text}>
          {!large || !item.imageUrl ? (
            <View style={styles.meta}>
              <Pill label={kind.label} color={kind.color} background={rgba(kind.color, 0.14)} />
              {item.endsAt ? (
                <Text variant="micro" color={colors.ink3}>
                  لغاية {formatDate(item.endsAt)}
                </Text>
              ) : null}
            </View>
          ) : null}
          <Text variant={large ? 'heading' : 'label'} weight="bold" numberOfLines={2} style={!large ? { fontSize: 16, lineHeight: 24 } : undefined}>
            {item.title}
          </Text>
          {item.description ? (
            <Text variant="caption" color={colors.ink2} numberOfLines={large ? 3 : 2}>
              {item.description}
            </Text>
          ) : null}
          {large && item.endsAt && item.imageUrl ? (
            <View style={styles.meta}>
              <MaterialIcons name="schedule" size={14} color={colors.ink3} />
              <Text variant="micro" color={colors.ink3}>
                لغاية {formatDate(item.endsAt)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Panel>
  );
});

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface2 },
  tag: { position: 'absolute', top: space.sm, end: space.sm, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  body: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  text: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surface2 },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
