import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, I18nManager, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { useOnboarding } from '@/src/onboarding/OnboardingProvider';
import { Button } from '@/src/ui/Button';
import type { MIcon } from '@/src/ui/Kit';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, motion, radius, rgba, space } from '@/src/ui/theme';

type Step = { key: string; icon: MIcon; stepLabel: string; title: string; body: string; chips: { label: string; icon?: MIcon; gold?: boolean }[] };

/** Stitch onboarding (four steps). What the app actually does — no promises beyond the real service. */
export const ONBOARDING_STEPS: Step[] = [
  {
    key: 'packages',
    icon: 'live-tv',
    stepLabel: 'الخطوة الأولى',
    title: 'هلا بيك بشاشتنا',
    body: 'باقات IPTV، باقات VIP ويا أجهزتها، والمنصات الرقمية، بأسعار واضحة بالدينار العراقي.',
    chips: [{ label: 'باقات VIP', icon: 'workspace-premium', gold: true }, { label: 'شاشات ذكية وموبايل' }, { label: 'بالدينار العراقي د.ع' }],
  },
  {
    key: 'choose',
    icon: 'widgets',
    stepLabel: 'الخطوة الثانية',
    title: 'اختار باقتك بسهولة',
    body: 'نفس الباقات والأسعار اللي بالموقع. اختار المدة اللي تناسبك وتصفح براحتك حتى بدون حساب.',
    chips: [{ label: '3 أشهر' }, { label: '6 أشهر' }, { label: 'سنة' }],
  },
  {
    key: 'pay',
    icon: 'receipt-long',
    stepLabel: 'الخطوة الثالثة',
    title: 'ادفع وارفع الوصل',
    body: 'حوّل المبلغ بالسوبر كي أو الحوالة، ارفع صورة الوصل، وفريقنا يدققها ويفعّل اشتراكك.',
    chips: [{ label: 'تحويل يدوي', icon: 'payments' }, { label: 'صورة الوصل', icon: 'cloud-upload' }],
  },
  {
    key: 'follow',
    icon: 'notifications-active',
    stepLabel: 'الخطوة الرابعة',
    title: 'تابع اشتراكك أول بأول',
    body: 'كم يوم باقي، تجديد بضغطة، إشعارات عن طلبك واشتراكك، ودعم قريب منك.',
    chips: [{ label: 'تجديد بضغطة', icon: 'autorenew' }, { label: 'دعم عراقي', icon: 'support-agent' }],
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

  const signIn = () => {
    complete();
    setTimeout(() => router.push('/login'), 0);
  };

  return (
    <View style={styles.root} testID="onboarding">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <View style={styles.counter}>
            <MaterialIcons name="stars" size={18} color={colors.brandInk} />
            <Text variant="label" color={colors.brandInk}>
              الخطوة {index + 1} من {ONBOARDING_STEPS.length}
            </Text>
          </View>
          {!last ? (
            <Pressable onPress={complete} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="تخطي للشاشة الرئيسية" testID="onboarding-skip" style={styles.skip}>
              <Text variant="label" color={colors.ink2}>
                تخطي للشاشة الرئيسية
              </Text>
              <MaterialIcons name="fast-forward" size={18} color={colors.ink2} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : null} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.segments}>
          {ONBOARDING_STEPS.map((item, i) => (
            <View key={item.key} style={[styles.segment, i <= index && styles.segmentOn]} />
          ))}
        </View>

        <View style={styles.body} {...pan.panHandlers}>
          <Animated.View style={{ flex: 1, gap: space.xl, opacity: anim, transform: [{ translateY }] }} accessibilityLiveRegion="polite">
            <View style={styles.art}>
              <View style={styles.glow} pointerEvents="none" />
              <View style={styles.orb}>
                <MaterialIcons name={step.icon} size={44} color={colors.brandInk} />
              </View>
              <View style={styles.chips}>
                {step.chips.map((chip) => (
                  <View key={chip.label} style={styles.chip}>
                    {chip.icon ? <MaterialIcons name={chip.icon} size={16} color={chip.gold ? colors.gold : colors.brandInk} /> : null}
                    <Text variant="label" color={colors.ink}>
                      {chip.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ gap: space.sm }}>
              <View style={styles.stepLabel}>
                <View style={styles.dot} />
                <Text variant="label" color={colors.brandInk}>
                  {step.stepLabel}
                </Text>
              </View>
              <Text variant="hero" weight="bold" accessibilityRole="header">
                {step.title}
              </Text>
              <Text variant="body" color={colors.ink2} style={{ fontSize: 16, lineHeight: 26 }}>
                {step.body}
              </Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {ONBOARDING_STEPS.map((item, i) => (
              <Pressable key={item.key} onPress={() => go(i)} accessibilityRole="button" accessibilityLabel={`الخطوة ${i + 1}`} hitSlop={8}>
                <View style={[styles.pageDot, i === index && styles.pageDotOn]} />
              </Pressable>
            ))}
          </View>
          <Button
            title={last ? 'ابدأ التصفح' : 'التالي'}
            iconEnd={I18nManager.isRTL ? 'arrow-back' : 'arrow-forward'}
            onPress={last ? complete : () => go(index + 1)}
            testID={last ? 'onboarding-start' : 'onboarding-next'}
            style={styles.cta}
          />
          <Button title="عندي حساب / تسجيل الدخول" icon="log-in-outline" variant="glass" onPress={signIn} testID="onboarding-login" style={styles.cta} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.sm, minHeight: 56 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  skip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  segments: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, marginTop: space.md },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surface2 },
  segmentOn: { backgroundColor: colors.brandInk },
  body: { flex: 1, padding: space.lg, paddingTop: space.xl },
  art: { flex: 1, minHeight: 220, borderRadius: 24, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', gap: space.xl, padding: space.lg, overflow: 'hidden' },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: rgba(colors.brand, 0.12) },
  orb: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, boxShadow: '0px 0px 24px rgba(37, 99, 235, 0.35)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, backgroundColor: colors.surface2 },
  stepLabel: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.brand },
  bottom: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  pageDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surface3 },
  pageDotOn: { width: 40, backgroundColor: colors.brandInk },
  cta: { alignSelf: 'stretch' },
});
