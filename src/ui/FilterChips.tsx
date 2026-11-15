import { ScrollView, Pressable, StyleSheet } from 'react-native';

import { Text } from './Text';
import { colors, radius, space } from './theme';

export type Chip<T extends string> = { value: T; label: string; count?: number };

/** Stitch filter pills (orders by state, notifications by kind). Scrolls when labels are long. */
export function FilterChips<T extends string>({ items, value, onChange, testID }: { items: Chip<T>[]; value: T; onChange: (value: T) => void; testID?: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="tablist" testID={testID}>
      {items.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.count !== undefined ? `${item.label}، ${item.count}` : item.label}
            testID={testID ? `${testID}-${item.value}` : undefined}
            style={({ pressed }) => [styles.chip, active && styles.active, pressed && { opacity: 0.85 }]}
          >
            <Text variant="label" color={active ? '#002A78' : colors.ink2}>
              {item.label}
            </Text>
            {item.count ? (
              <Text variant="caption" weight="bold" color={active ? '#002A78' : colors.ink3} style={styles.count}>
                {item.count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.surface3,
    backgroundColor: colors.surface,
  },
  // Stitch: the selected filter is a filled pill.
  active: { borderColor: colors.brandInk, backgroundColor: colors.brandInk },
  count: { minWidth: 18, textAlign: 'center' },
});
