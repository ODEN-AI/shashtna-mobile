import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { JourneyStep } from '@/src/api/types';

import { Text } from './Text';
import { colors, space } from './theme';

/** The website's order journey (choose → pay → proof → review & activation). */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {steps.map((step, index) => {
        const done = step.state === 'done';
        const current = step.state === 'current';

        return (
          <View key={step.key} style={styles.step} accessibilityLabel={`${step.label}: ${done ? 'تم' : current ? 'الحالية' : 'قادمة'}`}>
            <View style={styles.track}>
              <View style={[styles.line, index === 0 && styles.hidden, (done || current) && styles.lineDone]} />
              <View style={[styles.circle, done && styles.circleDone, current && styles.circleCurrent]}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#002A78" />
                ) : (
                  <Text variant="caption" weight="bold" color={current ? colors.onAmber : colors.ink3}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <View style={[styles.line, index === steps.length - 1 && styles.hidden, done && styles.lineDone]} />
            </View>
            <Text variant="caption" center color={current ? colors.ink : done ? colors.ink2 : colors.ink3} weight={current ? 'bold' : 'medium'}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, gap: space.sm, alignItems: 'center' },
  track: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  line: { flex: 1, height: 2, backgroundColor: colors.surface3 },
  lineDone: { backgroundColor: 'rgba(180, 197, 255, 0.5)' },
  hidden: { opacity: 0 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  circleDone: { backgroundColor: colors.brandInk },
  circleCurrent: { backgroundColor: colors.amber, boxShadow: '0px 0px 12px rgba(255, 185, 95, 0.45)' },
});
