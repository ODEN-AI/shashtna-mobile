import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { AmbientBackground } from './AmbientBackground';
import { OfflineBanner } from './OfflineBanner';
import { colors, space, tabBar } from './theme';

/** Bottom space a tab screen needs so its last item clears the floating tab bar. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return tabBar.height + tabBar.gap + Math.max(insets.bottom, space.md) + space.lg;
}

/**
 * Standard screen: navy canvas with ambient light, safe areas,
 * pull-to-refresh, keyboard-aware. Tab screens pass `tabBar` so content
 * scrolls clear of the floating navigation.
 */
export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  edges = ['bottom'],
  contentStyle,
  footer,
  tabBar: underTabBar,
  background = 'app',
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  tabBar?: boolean;
  background?: 'app' | 'auth' | 'none';
}) {
  const inset = useTabBarInset();
  const bottom = underTabBar ? { paddingBottom: inset } : null;

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {background !== 'none' ? <AmbientBackground variant={background} /> : null}
      <OfflineBanner />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, bottom, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={Boolean(refreshing)}
                  onRefresh={onRefresh}
                  tintColor={colors.brandInk}
                  colors={[colors.brand]}
                  progressBackgroundColor={colors.surface2}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  content: { padding: space.lg, paddingBottom: space.xxl * 2, gap: space.xl },
  footer: {
    padding: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    backgroundColor: 'rgba(2, 11, 38, 0.94)',
  },
});
