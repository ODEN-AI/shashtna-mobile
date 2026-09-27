import type { Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconTile, type IconName } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

export type QuickAction = { key: string; label: string; icon: IconName; href: Href; badge?: number; requiresAuth?: boolean };

/** A calm grid of real destinations in one glass panel (three per row). */
export function QuickActions({ items, onOpen }: { items: QuickAction[]; onOpen: (action: QuickAction) => void }) {
  return (
    <View style={styles.panel} testID="quick-actions">
      {items.map((action) => (
        <Pressable
          key={action.key}
          onPress={() => onOpen(action)}
          accessibilityRole="button"
          accessibilityLabel={action.badge ? `${action.label}، ${action.badge} جديد` : action.label}
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
          testID={`quick-${action.key}`}
        >
          <View>
            <IconTile name={action.icon} size={50} filled={action.key === 'packages'} tone="brand" />
            {action.badge ? <View style={styles.dot} /> : null}
          </View>
          <Text variant="caption" weight="bold" center color={colors.ink2} numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: space.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(1, 6, 25, 0.45)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  item: { width: '33.33%', alignItems: 'center', gap: space.sm, minHeight: 76, paddingHorizontal: 2 },
  dot: { position: 'absolute', top: -2, end: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ice, borderWidth: 2, borderColor: colors.canvas },
});
