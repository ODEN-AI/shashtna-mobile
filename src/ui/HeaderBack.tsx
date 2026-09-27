import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { I18nManager, Pressable } from 'react-native';

import { colors, hitSlop } from './theme';

/**
 * Back control for the account-only stack. Its first screen is the root of a
 * nested stack, where the native header would show no back button; this one
 * always returns to wherever the customer came from.
 */
export function HeaderBack() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="رجوع"
      style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass }}
      testID="header-back"
    >
      <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.ink} />
    </Pressable>
  );
}
