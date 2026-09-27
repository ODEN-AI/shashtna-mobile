import { ScrollView, Pressable, StyleSheet } from 'react-native';

import { gradientStyle, linear } from './gradient';
import { Text } from './Text';
import { colors, gradients, radius, space } from './theme';

export type Chip<T extends string> = { value: T; label: string; count?: number };

/** Segmented filters (packages by type, orders by state). Scrolls when labels are long. */
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
            <Text variant="label" color={active ? '#FFFFFF' : colors.ink2}>
              {item.label}
            </Text>
            {item.count ? (
              <Text variant="caption" weight="bold" color={active ? colors.ice : colors.ink3} style={styles.count}>
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
    minHeight: 42,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  active: { borderColor: colors.glassEdge, backgroundColor: colors.brand, ...gradientStyle(linear(100, gradients.active)) },
  count: { minWidth: 18, textAlign: 'center' },
});
