import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { colors, fontFamily, hitSlop, radius, space } from './theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  ltr?: boolean;
  password?: boolean;
  /** `pill`: fully rounded, transparent — the auth card style. */
  variant?: 'glass' | 'pill';
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export const Field = forwardRef<TextInput, Props>(function Field({ label, error, hint, ltr, password, variant = 'glass', icon, style, ...props }, ref) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text variant="label" color={colors.ink2}>
        {label}
      </Text>
      <View style={[styles.box, variant === 'pill' && styles.pill, focused && styles.focused, error ? styles.invalid : null]}>
        {icon ? <Ionicons name={icon} size={19} color={focused ? colors.brandInk : colors.ink3} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.ink3}
          selectionColor={colors.brand}
          secureTextEntry={password && hidden}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.input, ltr && styles.ltr, style]}
          accessibilityLabel={label}
          {...props}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'إظهار كلمة المرور' : 'إخفاء كلمة المرور'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.ink3} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={colors.ink3}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 54,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surface3,
    backgroundColor: colors.canvasDeep,
  },
  pill: { borderRadius: radius.pill, backgroundColor: colors.canvasDeep, borderColor: colors.surface3, paddingHorizontal: space.xl },
  focused: { borderColor: colors.brand, backgroundColor: 'rgba(37, 99, 235, 0.08)' },
  invalid: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    paddingVertical: space.md,
  },
  // Phone numbers and codes are typed left-to-right; alignment still follows
  // the RTL layout (start = right).
  ltr: { writingDirection: 'ltr' },
});
