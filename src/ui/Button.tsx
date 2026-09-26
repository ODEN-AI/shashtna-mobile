import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { colors, radius, space } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow';

const BACKGROUND: Record<Variant, string> = {
  primary: colors.brand,
  secondary: colors.surface3,
  ghost: 'transparent',
  danger: 'rgba(248, 113, 113, 0.14)',
  glow: colors.glow,
};

const FOREGROUND: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: colors.ink,
  ghost: colors.brandInk,
  danger: colors.danger,
  glow: colors.canvas,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  compact,
  style,
  testID,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: BACKGROUND[variant] },
        variant === 'secondary' && styles.outline,
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FOREGROUND[variant]} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={compact ? 16 : 19} color={FOREGROUND[variant]} /> : null}
          <Text variant="label" color={FOREGROUND[variant]} style={{ fontSize: compact ? 13.5 : 15.5 }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 40, paddingHorizontal: space.lg, borderRadius: radius.sm },
  outline: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
});
