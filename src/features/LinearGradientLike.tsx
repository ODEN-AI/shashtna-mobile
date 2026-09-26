import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/src/ui/theme';

/**
 * Hero surface with a restrained accent glow, built from plain views (no
 * extra native gradient dependency): a tinted corner and a glowing border.
 */
export function LinearGradientLike({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <View style={[styles.hero, { borderColor: `${accent}55`, shadowColor: accent }]}>
      <View pointerEvents="none" style={[styles.orb, { backgroundColor: accent }]} />
      <View pointerEvents="none" style={[styles.orbSmall, { backgroundColor: colors.brand }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  orb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: -110, start: -60, opacity: 0.14 },
  orbSmall: { position: 'absolute', width: 160, height: 160, borderRadius: 80, bottom: -90, end: -40, opacity: 0.12 },
  content: { padding: space.xl, gap: space.md },
});
