import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { gradientStyle, linear, radial, RGB } from './gradient';
import { Text } from './Text';
import { colors, gradients, radius, shadow, space } from './theme';

/**
 * primary  gradient pill — the one main action on a screen
 * light    ice-white pill with navy text — auth and spotlight CTAs on gradients
 * glass    translucent pill — secondary actions (alias: secondary)
 * ghost    text only
 * danger   destructive, calm red glass
 */
type Variant = 'primary' | 'light' | 'glass' | 'secondary' | 'ghost' | 'danger' | 'glow';

const FOREGROUND: Record<Variant, string> = {
  primary: '#FFFFFF',
  glow: '#FFFFFF',
  light: colors.inkOnLight,
  glass: colors.ink,
  secondary: colors.ink,
  ghost: colors.brandInk,
  danger: colors.danger,
};

const PRIMARY = gradientStyle(radial(RGB.ice, 0.14, '50% 0%', '70%'), linear(100, gradients.primary));

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconEnd,
  loading,
  disabled,
  compact,
  style,
  testID,
  accessibilityHint,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Icon after the label (e.g. a direction arrow). */
  iconEnd?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}) {
  const inactive = disabled || loading;
  const color = FOREGROUND[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        VARIANT_STYLE[variant],
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={compact ? 16 : 19} color={color} /> : null}
          <Text variant="label" color={color} numberOfLines={1} style={{ fontSize: compact ? 13.5 : 15.5, flexShrink: 1 }}>
            {title}
          </Text>
          {iconEnd ? <Ionicons name={iconEnd} size={compact ? 16 : 19} color={color} /> : null}
        </View>
      )}
    </Pressable>
  );
}

/** The screen's main action. */
export function PrimaryButton(props: Omit<ComponentProps<typeof Button>, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

/** A secondary action on glass. */
export function GlassButton(props: Omit<ComponentProps<typeof Button>, 'variant'>) {
  return <Button {...props} variant="glass" />;
}

const glass: ViewStyle = {
  backgroundColor: colors.glassStrong,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderTopColor: colors.glassEdge,
};

const VARIANT_STYLE: Record<Variant, ViewStyle> = {
  primary: { ...PRIMARY, backgroundColor: colors.brand, boxShadow: shadow.glowSoft },
  glow: { ...PRIMARY, backgroundColor: colors.brand, boxShadow: shadow.glowSoft },
  light: { backgroundColor: '#F3F8FF', boxShadow: shadow.card },
  glass,
  secondary: glass,
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'rgba(255, 122, 122, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 122, 122, 0.28)' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compact: { minHeight: 44, paddingHorizontal: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
