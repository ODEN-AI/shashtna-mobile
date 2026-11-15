import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setPendingRedirect } from '@/src/auth/redirect';
import { AmbientBackground } from '@/src/ui/AmbientBackground';
import { BrandMark } from '@/src/ui/BrandMark';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, rgba, space } from '@/src/ui/theme';

/** Stitch canvas: deep navy with two soft light pools (cobalt above, amber below). Static views, no blur. */
const Backdrop = memo(function Backdrop() {
  const { width } = useWindowDimensions();
  const size = Math.max(width, 360) * 0.9;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <AmbientBackground variant="auth" />
      <View style={[styles.pool, { width: size, height: size, borderRadius: size / 2, top: -size * 0.45, start: -size * 0.35, backgroundColor: rgba(colors.brand, 0.16) }]} />
      <View style={[styles.pool, { width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, bottom: -size * 0.35, end: -size * 0.3, backgroundColor: rgba(colors.amberDeep, 0.1) }]} />
    </View>
  );
});

export function AuthScene({ title, subtitle, children, footer, back }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; back?: boolean }) {
  const close = () => {
    // Leaving without signing in: forget where they were headed.
    if (!back) setPendingRedirect(null);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.root}>
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <OfflineBanner />
        <View style={styles.topBar}>
          <Pressable
            onPress={close}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={back ? 'رجوع' : 'إغلاق والتصفح كضيف'}
            style={styles.close}
            testID="auth-close"
          >
            <Ionicons name={back ? 'arrow-forward' : 'close'} size={22} color={colors.ink} />
          </Pressable>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.brand}>
              <BrandMark size={64} />
              <Text variant="title" weight="bold">
                شاشتنا
              </Text>
            </View>
            <View style={styles.card}>
              <View style={{ gap: space.xs, marginBottom: space.sm }}>
                <Text variant="title" weight="bold" center accessibilityRole="header">
                  {title}
                </Text>
                {subtitle ? (
                  <Text variant="label" center color={colors.ink2} weight="medium">
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {children}
            </View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas, overflow: 'hidden' },
  pool: { position: 'absolute' },
  topBar: { flexDirection: 'row', paddingHorizontal: space.lg, paddingTop: space.sm },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: space.xl, paddingTop: space.sm, gap: space.lg },
  brand: { alignItems: 'center', gap: space.sm },
  card: {
    gap: space.lg,
    padding: space.xl,
    paddingVertical: space.xxl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.5)',
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  footer: { alignItems: 'center', gap: space.md },
});
