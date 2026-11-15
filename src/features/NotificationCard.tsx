import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AppNotification } from '@/src/api/types';
import { formatRelative } from '@/src/lib/format';
import { notificationType } from '@/src/lib/status';
import { Button } from '@/src/ui/Button';
import type { MIcon } from '@/src/ui/Kit';
import { Text } from '@/src/ui/Text';
import { colors, radius, rgba, space, toneColor } from '@/src/ui/theme';

/** Ionicons names from the status table, mapped to the Material icons the Stitch design uses. */
const ICON: Record<string, MIcon> = {
  'receipt-outline': 'receipt-long',
  'wallet-outline': 'account-balance-wallet',
  'checkmark-circle-outline': 'check-circle',
  'refresh-circle-outline': 'autorenew',
  'time-outline': 'schedule',
  'alert-circle-outline': 'error-outline',
  'chatbubbles-outline': 'chat',
  'megaphone-outline': 'campaign',
  'pricetag-outline': 'local-offer',
  'construct-outline': 'build',
  'mail-outline': 'mail',
};

const iconOf = (name: string): MIcon => ICON[name] ?? 'notifications';

/** Stitch announcements centre hero: image, type pill, title, body, one cobalt action. */
export function FeaturedNotification({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const meta = notificationType(item.type);
  const color = toneColor[meta.tone];

  return (
    <View style={styles.featured} testID="notification-featured">
      {item.imageUrl ? (
        <View>
          <Image source={item.imageUrl} style={styles.heroImage} contentFit="cover" recyclingKey={String(item.id)} />
          <View style={styles.heroTag}>
            <MaterialIcons name={iconOf(meta.icon)} size={14} color={colors.onAmber} />
            <Text variant="micro" color={colors.onAmber}>
              {meta.label}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.typePill, { backgroundColor: rgba(color, 0.14) }]}>
          <MaterialIcons name={iconOf(meta.icon)} size={14} color={color} />
          <Text variant="micro" color={color}>
            {meta.label}
          </Text>
        </View>
      )}
      <View style={{ gap: space.sm }}>
        <Text variant="title" weight="bold" numberOfLines={3}>
          {item.title}
        </Text>
        <Text variant="body" color={colors.ink2} numberOfLines={4}>
          {item.body}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text variant="caption" color={colors.ink3}>
          {formatRelative(item.createdAt)}
        </Text>
        {!item.readAt ? (
          <View style={styles.newChip}>
            <Text variant="micro" color={colors.onBrand}>
              جديد
            </Text>
          </View>
        ) : null}
      </View>
      <Button title="افتح" iconEnd="arrow-back" onPress={onPress} accessibilityHint={item.title} />
    </View>
  );
}

/** Stitch announcement card: icon tile, type pill and time, title, body, unread dot. */
export const NotificationCard = memo(function NotificationCard({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const meta = notificationType(item.type);
  const unread = !item.readAt;
  const color = toneColor[meta.tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'غير مقروء. ' : ''}${meta.label}. ${item.title}. ${item.body}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
      testID={`notification-${item.id}`}
    >
      <View style={styles.cardTop}>
        <View style={[styles.tile, { backgroundColor: rgba(color, 0.14) }]}>
          <MaterialIcons name={iconOf(meta.icon)} size={22} color={color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.metaRow}>
            <View style={[styles.typePill, { backgroundColor: rgba(color, 0.14) }]}>
              <Text variant="micro" color={color}>
                {meta.label}
              </Text>
            </View>
            <Text variant="micro" color={colors.ink3}>
              {formatRelative(item.createdAt)}
            </Text>
          </View>
          <Text variant="label" weight="bold" numberOfLines={2} style={{ fontSize: 16, lineHeight: 24 }}>
            {item.title}
          </Text>
        </View>
        {unread ? <View style={styles.dot} /> : null}
      </View>
      <Text variant="body" color={colors.ink2} numberOfLines={3}>
        {item.body}
      </Text>
      {item.imageUrl ? <Image source={item.imageUrl} style={styles.image} contentFit="cover" recyclingKey={String(item.id)} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  featured: { gap: space.lg, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.surface, boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.45)' },
  heroImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.surface2 },
  heroTag: { position: 'absolute', top: space.sm, end: space.sm, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.amber },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newChip: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.brand },
  card: { gap: space.md, padding: space.lg, borderRadius: radius.xl, backgroundColor: colors.surface },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  tile: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandInk, marginTop: 6 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
});
