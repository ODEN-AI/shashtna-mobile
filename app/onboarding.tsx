import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Animated, I18nManager, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { useOnboarding } from '@/src/onboarding/OnboardingProvider';
import { AmbientBackground } from '@/src/ui/AmbientBackground';
import { BrandMark } from '@/src/ui/BrandMark';
import { Button } from '@/src/ui/Button';
import { gradientStyle, linear, radial, RGB } from '@/src/ui/gradient';
import { ProgressDots } from '@/src/ui/ProgressDots';
import { Text } from '@/src/ui/Text';
import { colors, gradients, hitSlop, motion, radius, shadow, space } from '@/src/ui/theme';

type Step = { key: string; icon: ComponentProps<typeof Ionicons>['name'] | 'brand'; eyebrow: string; title: string; body: string };

/** What the app actually does — no promises beyond the real service. */
export const ONBOARDING_STEPS: Step[] = [
  {
    key: 'welcome',
    icon: 'brand',
    eyebrow: 'شاشتنا',
    title: 'هلا بيك بشاشتنا',
    body: 'اشتراكات IPTV وأجهزة VIP من مكان واحد، بالعربي وبخطوات واضحة.',
  },
  {
    key: 'packages',
    icon: 'sparkles',
    eyebrow: 'الباقات',
    title: 'اختار الباقة اللي تناسبك',
    body: 'نفس الباقات والأسعار اللي بالموقع. تصفحها براحتك حتى بدون حساب.',
  },
  {
    key: 'orders',
    icon: 'receipt',
    eyebrow: 'الطلب والدفع',
    title: 'اطلب، ادفع، وتابع',
    body: 'ادفع بالتحويل، ارفع صورة الإثبات، وتابع طلبك خطوة بخطوة لحد التفعيل.',
  },
  {
    key: 'updates',
    icon: 'notifications',
    eyebrow: 'دايمًا على اطلاع',
    title: 'تحديثات أول بأول',
    body: 'إشعارات عن طلبك واشتراكك والعروض، ودعم فني قريب منك.',
  },
];

export default function OnboardingScreen() {
  const { complete } = useOnboarding();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [anim] = useState(() => new Animated.Value(1));
  const step = ONBOARDING_STEPS[index];
  const last = index === ONBOARDING_STEPS.length - 1;

  useEffect(() => {
    if (reduced) {
      anim.setValue(1);
      return;
    }
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: motion.slow, useNativeDriver: true }).start();
  }, [index, anim, reduced]);

  const go = (next: number) => setIndex(Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, next)));

  // Swipe between steps (towards the reading direction = next).
  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const forward = I18nManager.isRTL ? g.dx > 0 : g.dx < 0;
        if (Math.abs(g.dx) > 50) setIndex((current) => Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, current + (forward ? 1 : -1))));
      },
    }),
  );

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  return (
    <View style={styles.root} testID="onboarding">
      <AmbientBackground variant="auth" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text variant="caption" color={colors.ink2} weight="bold">
            {index + 1} / {ONBOARDING_STEPS.length}
          </Text>
          {!last ? (
            <Pressable onPress={complete} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="تخطي" testID="onboarding-skip" style={styles.skip}>
              <Text variant="label" color={colors.ink}>
                تخطي
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.center} {...pan.panHandlers}>
          <Animated.View style={[styles.card, { opacity: anim, transform: [{ translateY }] }]} accessibilityLiveRegion="polite">
            <View style={styles.art}>
              {step.icon === 'brand' ? (
                <BrandMark size={112} glow />
              ) : (
                <View style={styles.iconOrb}>
                  <Ionicons name={step.icon} size={48} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text variant="label" color={colors.glow} center>
              {step.eyebrow}
            </Text>
            <Text variant="title" center accessibilityRole="header">
              {step.title}
            </Text>
            <Text color={colors.ink2} center style={{ maxWidth: 320 }}>
              {step.body}
            </Text>

            <Button
              title={last ? 'ابدأ التصفح' : 'التالي'}
              variant="light"
              iconEnd={I18nManager.isRTL ? 'arrow-back' : 'arrow-forward'}
              onPress={last ? complete : () => go(index + 1)}
              testID={last ? 'onboarding-start' : 'onboarding-next'}
              style={styles.cta}
            />
          </Animated.View>
        </View>

        <View style={styles.bottom}>
          <ProgressDots count={ONBOARDING_STEPS.length} index={index} onSelect={go} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvasDeep },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.sm, minHeight: 48 },
  skip: {
    paddingHorizontal: space.lg,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  center: { flex: 1, justifyContent: 'center', padding: space.xl },
  card: {
    alignItems: 'center',
    gap: space.md,
    padding: space.xl,
    paddingTop: space.xxxl,
    borderRadius: radius.xxl,
    backgroundColor: 'rgba(8, 24, 84, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(203, 233, 253, 0.18)',
    borderTopColor: 'rgba(203, 233, 253, 0.34)',
    boxShadow: shadow.float,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    ...gradientStyle(linear(160, ['rgba(203, 233, 253, 0.12)', 'rgba(203, 233, 253, 0.02)'])),
  },
  art: { marginBottom: space.md, minHeight: 116, justifyContent: 'center' },
  iconOrb: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassEdge,
    backgroundColor: colors.brand,
    boxShadow: shadow.glow,
    ...gradientStyle(radial(RGB.ice, 0.35, '30% 20%', '60%'), linear(145, gradients.hero)),
  },
  cta: { alignSelf: 'stretch', marginTop: space.lg },
  bottom: { paddingBottom: space.xl, paddingTop: space.sm },
});
