import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';
import { colors, radius, space } from './theme';

type ToastTone = 'success' | 'error' | 'info';
type ToastState = { message: string; tone: ToastTone; key: number } | null;

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => undefined);

/** Short confirmations ("تم النسخ", "تم رفع الإثبات"). Errors stay inline on screens. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    setToast({ message, tone, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;

    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => finished && setToast(null));
  }, [toast, opacity]);

  const color = toast?.tone === 'error' ? colors.danger : toast?.tone === 'info' ? colors.info : colors.success;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { opacity, bottom: insets.bottom + 90, borderColor: `${color}66` }]}
        >
          <Ionicons name={toast.tone === 'error' ? 'alert-circle' : toast.tone === 'info' ? 'information-circle' : 'checkmark-circle'} size={20} color={color} />
          <Text variant="label" style={{ flex: 1 }}>
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface3,
    elevation: 8,
  },
});
