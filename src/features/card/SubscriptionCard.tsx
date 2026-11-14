import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import type { Subscription } from '@/src/api/types';
import { formatDate } from '@/src/lib/format';
import { Text } from '@/src/ui/Text';
import { CARD_RATIO, colors, palette, radius, space } from '@/src/ui/theme';

type Look = 'running' | 'expiring' | 'ended';

export function cardLook(subscription: Subscription): Look {
  if (subscription.state === 'EXPIRED' || subscription.state === 'SUSPENDED' || subscription.daysRemaining <= 0) return 'ended';
  if (subscription.state === 'EXPIRING') return 'expiring';
  return 'running';
}

/** Solid light ink on the brand face (≥ 7:1), never alpha-tinted white. */
const ON_FACE = '#E3EAFF';
const SCALE = 1.15;

/**
 * Counts up only when the days left grew since the card was last shown (an
 * activation or a renewal); otherwise, and under reduced motion, it is instant.
 */
function useCountUp(target: number, key: string) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    let cancelled = false;
    const progress = new Animated.Value(0);
    const id = progress.addListener(({ value: v }) => setValue(Math.round(v * target)));
    const storageKey = `shashtna.card.days.${key}`;

    void (async () => {
      let previous: number | null = null;
      let reduced = false;

      try {
        const stored = await AsyncStorage.getItem(storageKey);
        previous = stored === null ? null : Number(stored);
        reduced = await AccessibilityInfo.isReduceMotionEnabled();
        await AsyncStorage.setItem(storageKey, String(target));
      } catch {
        // Storage or accessibility unavailable: show the number as is.
      }

      if (cancelled) return;

      const grew = previous === null || target > previous;

      if (!grew || reduced || target <= 1) {
        setValue(target);
        return;
      }

      setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    })();

    return () => {
      cancelled = true;
      progress.removeListener(id);
      progress.stopAnimation();
    };
  }, [target, key]);

  return value;
}

function Seal({ dim }: { dim?: boolean }) {
  return (
    <View style={[styles.seal, dim && { borderColor: colors.ended }]} accessibilityElementsHidden importantForAccessibility="no">
      <Text variant="label" color={dim ? colors.ended : palette.gold} style={styles.sealText} maxFontSizeMultiplier={1}>
        ش
      </Text>
    </View>
  );
}

function daysWord(days: number) {
  return days >= 3 && days <= 10 ? 'أيام باقية' : 'يوم باقي';
}

/**
 * «بطاقة شاشتنا»: the customer's subscription as a card in hand — the brand
 * and plan on top, days left large on the brand face, the end date on a silver
 * strip beside the gold seal. Expiring turns the strip amber; ended fades.
 */
export function SubscriptionCard({ subscription, onPress }: { subscription: Subscription; onPress?: () => void }) {
  const look = cardLook(subscription);
  const ended = look === 'ended';
  const expiring = look === 'expiring';
  const days = Math.max(0, subscription.daysRemaining);
  const shown = useCountUp(ended ? 0 : days, String(subscription.id));

  const label = ended
    ? `${subscription.packageName}، انتهى الاشتراك بتاريخ ${formatDate(subscription.expiryDate)}`
    : `${subscription.packageName}، باقي ${days} يوم، ينتهي ${formatDate(subscription.expiryDate)}${expiring ? '، قرب ينتهي' : ''}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.card, { backgroundColor: ended ? colors.surface3 : palette.brand }, pressed && styles.pressed]}
      testID="subscription-card"
    >
      <View style={styles.sheen} pointerEvents="none" />

      <View style={styles.top}>
        <Text variant="heading" weight="heavy" color={ended ? colors.ink2 : colors.ink} maxFontSizeMultiplier={SCALE}>
          شاشتنا
        </Text>
        <View style={[styles.plan, ended && { borderColor: colors.lineStrong }]}>
          <Text variant="caption" weight="bold" color={ended ? colors.ink3 : ON_FACE} numberOfLines={1} maxFontSizeMultiplier={SCALE}>
            {subscription.packageName}
          </Text>
        </View>
      </View>

      {ended ? (
        <Text variant="hero" color={colors.ink2} maxFontSizeMultiplier={SCALE}>
          انتهى
        </Text>
      ) : (
        <View style={styles.daysRow}>
          <Text variant="display" color={colors.ink} style={styles.nums} maxFontSizeMultiplier={1}>
            {shown}
          </Text>
          <Text variant="heading" color={ON_FACE} maxFontSizeMultiplier={SCALE}>
            {daysWord(days)}
          </Text>
        </View>
      )}

      <View style={styles.bottom}>
        <View style={[styles.strip, expiring && styles.stripWarn, ended && styles.stripEnded]}>
          <Text variant="label" color={ended ? colors.ink2 : colors.inkOnLight} style={styles.nums} maxFontSizeMultiplier={SCALE}>
            {expiring ? 'قرب ينتهي · ' : ended ? 'انتهى ' : 'ينتهي '}
            {formatDate(subscription.expiryDate)}
          </Text>
        </View>
        <Seal dim={ended} />
      </View>
    </Pressable>
  );
}

/** The card's place before the first subscription: an outline with one clear next step. */
export function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={[styles.card, styles.empty]} testID="empty-card">
      <View style={styles.top}>
        <Text variant="heading" weight="heavy" color={colors.ink2} maxFontSizeMultiplier={SCALE}>
          شاشتنا
        </Text>
        <Seal />
      </View>
      <View style={{ gap: space.xs }}>
        <Text variant="title" maxFontSizeMultiplier={SCALE}>
          {title}
        </Text>
        <Text variant="body" color={colors.ink2} maxFontSizeMultiplier={SCALE}>
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: CARD_RATIO,
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: space.lg,
    paddingHorizontal: space.xl,
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  sheen: {
    position: 'absolute',
    top: -80,
    end: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  plan: {
    flexShrink: 1,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  daysRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  strip: { paddingVertical: 6, paddingHorizontal: space.md, borderRadius: radius.xs, backgroundColor: palette.silver, flexShrink: 1 },
  stripWarn: { backgroundColor: colors.expiring },
  stripEnded: { backgroundColor: colors.surface2 },
  seal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: { fontSize: 17, lineHeight: 22 },
  empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderStyle: 'dashed' },
});
