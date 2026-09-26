import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { NextAction } from '@/src/api/types';
import { Card } from '@/src/ui/Card';
import { IconWell, type IconName } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, space, type Tone } from '@/src/ui/theme';

const META: Record<NextAction['kind'], { icon: IconName; tone: Tone; cta: string }> = {
  PAY_ORDER: { icon: 'wallet', tone: 'warning', cta: 'ادفع وارفع الإثبات' },
  WAIT_REVIEW: { icon: 'hourglass', tone: 'info', cta: 'تفاصيل الطلب' },
  WAIT_ACTIVATION: { icon: 'flash', tone: 'brand', cta: 'تفاصيل الطلب' },
  RENEW: { icon: 'refresh-circle', tone: 'warning', cta: 'جدّد الآن' },
  CHOOSE_PLAN: { icon: 'sparkles', tone: 'glow', cta: 'اختار باقتك' },
};

/** "شنو لازم أسوي؟" — exactly one clear next step from the backend. */
export function NextActionCard({ action, renewSlug }: { action: NextAction; renewSlug?: string | null }) {
  const meta = META[action.kind];

  const go = () => {
    if (action.orderId) return router.push(`/orders/${action.orderId}`);
    if (action.kind === 'RENEW' && renewSlug && action.subscriptionId) {
      return router.push({ pathname: '/packages/[slug]', params: { slug: renewSlug, renew: String(action.subscriptionId) } });
    }
    if (action.subscriptionId) return router.push(`/subscriptions/${action.subscriptionId}`);
    return router.push('/packages');
  };

  return (
    <Card onPress={go} accessibilityLabel={`${action.title}. ${meta.cta}`} style={styles.card}>
      <IconWell name={meta.icon} tone={meta.tone} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading">{action.title}</Text>
        <Text variant="caption" color={colors.ink2}>
          {action.body}
        </Text>
        <Text variant="label" color={colors.brandInk} style={{ marginTop: space.xs }}>
          {meta.cta} ←
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
});
