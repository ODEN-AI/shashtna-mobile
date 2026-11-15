import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { radius, toneBackground, toneColor, type Tone } from './theme';

/** Stitch status chip: a tinted pill (12% tone), no stroke; the dot marks live states. */
export function StatusBadge({ label, tone = 'neutral', dot }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: toneBackground(tone, 0.12) }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} /> : null}
      <Text variant="micro" color={toneColor[tone]} numberOfLines={1} style={{ fontSize: 12, lineHeight: 16 }}>
        {label}
      </Text>
    </View>
  );
}

export const Badge = StatusBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
