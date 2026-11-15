import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { colors, radius, shadow, space } from './theme';

/**
 * Stitch buttons (all pill-shaped):
 * primary  royal cobalt with a top highlight — a screen's main action
 * amber    warm amber — renew / redeem (the attention action)
 * vip      obsidian with a gold rim and gold text — VIP purchases
 * light    pale on dark — a white call to action on banners
 * glass    raised navy surface — secondary actions (alias: secondary)
 * ghost    text only
 * danger   destructive, calm red
 */
type Variant = 'primary' | 'amber' | 'vip' | 'light' | 'glass' | 'secondary' | 'ghost' | 'danger' | 'glow';

const FOREGROUND: Record<Variant, string> = {
  primary: '#FFFFFF',
  glow: '#FFFFFF',
  amber: colors.onAmber,
  vip: colors.goldLight,
  light: colors.inkOnLight,
  glass: colors.ink,
  secondary: colors.ink,
  ghost: colors.brandInk,
  danger: colors.danger,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconEnd,
  loading,
  disabled,
  compact,
  size,
  color: tint,
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
  /** lg: the 56dp hero action. */
  size?: 'lg';
  /** Overrides the variant's text and icon colour (e.g. amber on a glass button). */
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}) {
  const inactive = disabled || loading;
  const color = tint ?? FOREGROUND[variant];

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
        size === 'lg' && styles.large,
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
          <Text variant="label" color={color} numberOfLines={1} style={{ fontSize: compact ? 13.5 : size === 'lg' ? 17 : 15.5, flexShrink: 1 }}>
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

const glass: ViewStyle = { backgroundColor: colors.surface2 };

const VARIANT_STYLE: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.brand, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)', boxShadow: shadow.glowSoft },
  glow: { backgroundColor: colors.brand, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)', boxShadow: shadow.glow },
  amber: { backgroundColor: colors.amber, boxShadow: shadow.amber },
  vip: { backgroundColor: '#121316', borderWidth: 1, borderColor: colors.gold, boxShadow: shadow.gold },
  light: { backgroundColor: '#FFFFFF' },
  glass,
  secondary: glass,
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compact: { minHeight: 44, paddingHorizontal: space.lg },
  large: { minHeight: 56 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
