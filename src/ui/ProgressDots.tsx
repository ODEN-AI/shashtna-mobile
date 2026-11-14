import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from './theme';

/** Step / slide indicator. The current dot stretches into a short pill. */
export function ProgressDots({ count, index, onSelect, label = 'الخطوة' }: { count: number; index: number; onSelect?: (index: number) => void; label?: string }) {
  if (count < 2) return null;

  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={`${label} ${index + 1} من ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Pressable key={i} onPress={onSelect ? () => onSelect(i) : undefined} disabled={!onSelect} hitSlop={8} accessibilityElementsHidden importantForAccessibility="no">
          <View style={[styles.dot, i === index && styles.active]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: 'rgba(244, 246, 251, 0.3)' },
  active: { width: 22, backgroundColor: colors.ice },
});
