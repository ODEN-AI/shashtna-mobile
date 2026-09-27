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
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text variant="caption" weight="bold" color={current ? colors.ink : colors.ink3}>
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
  line: { flex: 1, height: 2, backgroundColor: colors.line },
  lineDone: { backgroundColor: colors.active },
  hidden: { opacity: 0 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  circleDone: { backgroundColor: colors.active, borderColor: colors.glassEdge },
  circleCurrent: { borderColor: colors.active, borderWidth: 2, backgroundColor: 'rgba(25, 81, 252, 0.3)', boxShadow: '0px 0px 12px rgba(55, 129, 252, 0.7)' },
});
