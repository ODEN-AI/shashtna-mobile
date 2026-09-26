import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Order } from '@/src/api/types';
import { formatPrice, formatRelative } from '@/src/lib/format';
import { ORDER_STAGE } from '@/src/lib/status';
import { Badge } from '@/src/ui/Badge';
import { Card } from '@/src/ui/Card';
import { IconWell } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export function OrderCard({ order }: { order: Order }) {
  const meta = ORDER_STAGE[order.stage];

  return (
    <Card onPress={() => router.push(`/orders/${order.id}`)} accessibilityLabel={`طلب ${order.number}، ${meta.label}`} style={styles.card}>
      <IconWell name={meta.icon as never} tone={meta.tone} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.row}>
          <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
            {order.serviceName}
          </Text>
          <Text variant="label" color={colors.ink}>
            {formatPrice(order.price)}
          </Text>
        </View>
        <View style={styles.row}>
          <Badge label={meta.label} tone={meta.tone} />
          <Text variant="caption" color={colors.ink3}>
            {order.number} · {formatRelative(order.createdAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
});
