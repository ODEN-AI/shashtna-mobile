import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { colors, font, hitSlop, radius, space } from './theme';

type Props = TextInputProps & { label: string; error?: string | null; hint?: string; ltr?: boolean; password?: boolean };

export const Field = forwardRef<TextInput, Props>(function Field({ label, error, hint, ltr, password, style, ...props }, ref) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text variant="label" color={colors.ink2}>
        {label}
      </Text>
      <View style={[styles.box, focused && styles.focused, error ? styles.invalid : null]}>
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
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface2,
  },
  focused: { borderColor: colors.brand },
  invalid: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: font.size.md,
    fontFamily: font.family,
    paddingVertical: space.md,
  },
  // Phone numbers and codes are typed left-to-right; alignment still follows
  // the RTL layout (start = right).
  ltr: { writingDirection: 'ltr' },
});
