import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setPendingRedirect } from '@/src/auth/redirect';
import { AmbientBackground } from '@/src/ui/AmbientBackground';
import { BrandMark } from '@/src/ui/BrandMark';
import { gradientStyle, linear, radial, RGB } from '@/src/ui/gradient';
import { OfflineBanner } from '@/src/ui/OfflineBanner';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, shadow, space } from '@/src/ui/theme';

/**
 * Two large luminous rings and soft geometric light shapes on deep blue:
 * static views, drawn once, no blur. Attention stays on the glass card.
 */
const Backdrop = memo(function Backdrop() {
  const { width, height } = useWindowDimensions();
  const ring = Math.max(width, 360) * 1.05;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <AmbientBackground variant="auth" />
      <View style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2, top: -ring * 0.42, end: -ring * 0.38 }]} />
      <View style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2, bottom: -ring * 0.45, start: -ring * 0.42 }]} />
      <View style={[styles.streak, { width: width * 1.6, top: height * 0.38, start: -width * 0.3 }]} />
      <View style={[styles.shape, { width: 120, height: 34, top: height * 0.16, start: width * 0.08, transform: [{ rotate: '-38deg' }] }]} />
      <View style={[styles.shape, { width: 64, height: 20, top: height * 0.72, end: width * 0.1, transform: [{ rotate: '32deg' }], opacity: 0.6 }]} />
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
              <BrandMark size={76} glow />
            </View>
            <View style={styles.card}>
              <View style={{ gap: space.xs, marginBottom: space.sm }}>
                <Text variant="title" center accessibilityRole="header">
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
  root: { flex: 1, backgroundColor: colors.canvasDeep, overflow: 'hidden' },
  ring: {
    position: 'absolute',
    borderWidth: 5,
    borderColor: colors.brand,
    boxShadow: '0px 0px 34px rgba(25, 81, 252, 0.85)',
    ...gradientStyle(radial(RGB.royal, 0.55, '50% 50%', '70%')),
  },
  streak: {
    position: 'absolute',
    height: 90,
    transform: [{ rotate: '-34deg' }],
    ...gradientStyle(linear(90, ['rgba(55, 129, 252, 0)', 'rgba(55, 129, 252, 0.22)', 'rgba(55, 129, 252, 0)'])),
  },
  shape: { position: 'absolute', borderRadius: 6, backgroundColor: 'rgba(55, 129, 252, 0.35)', boxShadow: '0px 0px 30px rgba(55, 129, 252, 0.6)' },
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
  brand: { alignItems: 'center' },
  card: {
    gap: space.lg,
    padding: space.xl,
    paddingVertical: space.xxl,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(8, 24, 84, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(203, 233, 253, 0.2)',
    borderTopColor: 'rgba(203, 233, 253, 0.34)',
    boxShadow: shadow.float,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    ...gradientStyle(linear(125, ['rgba(203, 233, 253, 0.10)', 'rgba(25, 81, 252, 0.10)', 'rgba(203, 233, 253, 0.03)'])),
  },
  footer: { alignItems: 'center', gap: space.md },
});
