import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space } from './theme';

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

/** The standard surface: one tonal step above the night canvas, with a hairline. */
export function GlassCard({ children, style, onPress, accessibilityLabel, accessibilityHint, glow, testID }: Props) {
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        android_ripple={{ color: 'rgba(244, 246, 251, 0.08)' }}
        style={({ pressed }) => [styles.card, glow && styles.glow, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.card, glow && styles.glow, style]}>
      {children}
    </View>
  );
}

/** Backwards-compatible name used across the app. */
export const Card = GlassCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    overflow: 'hidden',
  },
  glow: {
    borderColor: colors.brand,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
