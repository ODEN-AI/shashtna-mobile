import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { gradientStyle, linear } from './gradient';
import { colors, gradients, radius, shadow, space } from './theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** A highlighted card: brighter rim and a soft blue glow. */
  glow?: boolean;
  testID?: string;
};

const SHEEN = gradientStyle(linear(180, gradients.glassSheen));

/**
 * GlassCard — the standard surface: a translucent layer over the navy canvas
 * with a lighter top edge (the "liquid glass" rim). No live blur.
 */
export function GlassCard({ children, style, onPress, accessibilityLabel, accessibilityHint, glow, testID }: Props) {
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        android_ripple={{ color: 'rgba(203, 233, 253, 0.08)' }}
        style={({ pressed }) => [styles.card, SHEEN, glow && styles.glow, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.card, SHEEN, glow && styles.glow, style]}>
      {children}
    </View>
  );
}

/** Backwards-compatible name used across the app. */
export const Card = GlassCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(10, 33, 89, 0.55)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
    padding: space.lg,
    overflow: 'hidden',
  },
  glow: {
    borderColor: 'rgba(108, 196, 255, 0.35)',
    borderTopColor: 'rgba(203, 233, 253, 0.45)',
    boxShadow: shadow.glowSoft,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
