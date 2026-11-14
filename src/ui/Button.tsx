import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { colors, palette, radius, space } from './theme';

/**
 * primary  solid brand blue — a screen's main action
 * light    paper white with night text — the one hero action (e.g. «جدّد»)
 * glass    quiet surface with a hairline — secondary actions (alias: secondary)
 * ghost    text only
 * danger   destructive, calm red
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

const glass: ViewStyle = {
  backgroundColor: colors.surface2,
  borderWidth: 1,
  borderColor: colors.lineStrong,
};

const VARIANT_STYLE: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.brand },
  glow: { backgroundColor: colors.brand },
  light: { backgroundColor: palette.paper },
  glass,
  secondary: glass,
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'rgba(255, 122, 122, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 122, 122, 0.28)' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
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
