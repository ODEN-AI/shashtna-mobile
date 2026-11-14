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
import { CARD_RATIO, colors, hitSlop, radius, space } from '@/src/ui/theme';

/** Night canvas with the corner of a Shashtna card peeking in: the same world as the home card. */
const Backdrop = memo(function Backdrop() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(width, 360) * 0.9;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <AmbientBackground variant="auth" />
      <View style={[styles.peek, { width: cardWidth, height: cardWidth / CARD_RATIO, top: -cardWidth * 0.36, end: -cardWidth * 0.3 }]}>
        <View style={styles.peekBand} />
      </View>
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
  root: { flex: 1, backgroundColor: colors.canvas, overflow: 'hidden' },
  peek: {
    position: 'absolute',
    borderRadius: radius.xxl,
    backgroundColor: colors.brand,
    opacity: 0.9,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    transform: [{ rotate: '-12deg' }],
  },
  peekBand: { height: 44, backgroundColor: colors.silver },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  footer: { alignItems: 'center', gap: space.md },
});
