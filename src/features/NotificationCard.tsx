import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppNotification } from '@/src/api/types';
import { formatRelative } from '@/src/lib/format';
import { notificationType } from '@/src/lib/status';
import { Button } from '@/src/ui/Button';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { IconTile } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, gradients, radius, space } from '@/src/ui/theme';

/** The top notification: bigger, on a gradient, with a clear action. */
export function FeaturedNotification({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const meta = notificationType(item.type);

  return (
    <GradientSurface stops={gradients.hero} style={styles.featured} testID="notification-featured">
      <View style={styles.featuredTop}>
        <IconTile name={meta.icon as never} tone="glow" size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" weight="bold" color={colors.ice}>
            {meta.label}
          </Text>
          <Text variant="heading" numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        {!item.readAt ? (
          <View style={styles.newChip}>
            <Text variant="caption" weight="heavy" color={colors.inkOnLight} style={{ fontSize: 10.5 }}>
              جديد
            </Text>
          </View>
        ) : null}
      </View>
      <Text color={colors.ice} numberOfLines={3}>
        {item.body}
      </Text>
      {item.imageUrl ? <Image source={item.imageUrl} style={styles.image} contentFit="cover" recyclingKey={String(item.id)} /> : null}
      <View style={styles.featuredFooter}>
        <Text variant="caption" color={colors.ice} style={{ flex: 1 }}>
          {formatRelative(item.createdAt)}
        </Text>
        <Button title="فتح" variant="light" compact iconEnd="arrow-back" onPress={onPress} accessibilityHint={item.title} />
      </View>
    </GradientSurface>
  );
}

export const NotificationCard = memo(function NotificationCard({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const meta = notificationType(item.type);
  const unread = !item.readAt;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'غير مقروء. ' : ''}${meta.label}. ${item.title}. ${item.body}`}
      style={({ pressed }) => [styles.card, unread && styles.unread, pressed && { opacity: 0.88 }]}
      testID={`notification-${item.id}`}
    >
      <IconTile name={meta.icon as never} tone={meta.tone} size={46} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.titleRow}>
          <Text variant="label" style={{ flex: 1 }} numberOfLines={2}>
            {item.title}
          </Text>
          {unread ? <View style={styles.dot} /> : null}
        </View>
        <Text variant="caption" color={colors.ink2} numberOfLines={2}>
          {item.body}
        </Text>
        {item.imageUrl ? <Image source={item.imageUrl} style={styles.image} contentFit="cover" recyclingKey={String(item.id)} /> : null}
        <View style={styles.metaRow}>
          <View style={styles.typeChip}>
            <Text variant="caption" weight="bold" color={colors.ink2} style={{ fontSize: 10.5 }}>
              {meta.label}
            </Text>
          </View>
          <Text variant="caption" color={colors.ink3}>
            {formatRelative(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  featured: { padding: space.lg, gap: space.md, borderRadius: radius.xl },
  featuredTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  newChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.ice, alignSelf: 'flex-start' },
  card: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(10, 33, 89, 0.4)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  unread: { backgroundColor: 'rgba(25, 81, 252, 0.14)', borderColor: 'rgba(108, 196, 255, 0.35)', borderTopColor: colors.glassEdge },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ice },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.line },
  image: { width: '100%', aspectRatio: 2, borderRadius: radius.md, marginTop: space.xs },
});
