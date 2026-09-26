import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { radius, toneBackground, toneColor, type Tone } from './theme';

export function Badge({ label, tone = 'neutral', dot }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: toneBackground(tone) }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} /> : null}
      <Text variant="caption" weight="bold" color={toneColor[tone]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
