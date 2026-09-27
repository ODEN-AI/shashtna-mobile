import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { radius, toneBackground, toneColor, type Tone } from './theme';

/** StatusBadge — a small tinted pill; the dot marks live states. */
export function StatusBadge({ label, tone = 'neutral', dot }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: toneBackground(tone, 0.16), borderColor: toneBackground(tone, 0.3) }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} /> : null}
      <Text variant="caption" weight="bold" color={toneColor[tone]} numberOfLines={1}>
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
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
