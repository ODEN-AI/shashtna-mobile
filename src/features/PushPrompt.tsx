import { StyleSheet, View } from 'react-native';

import { usePush } from '@/src/push/PushProvider';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { IconWell } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

/** Shown only when notifications are off, so payment and activation news isn't missed. */
export function PushPrompt() {
  const { permission, enable } = usePush();

  if (permission === 'granted' || permission === 'unavailable') return null;

  return (
    <Card style={styles.card}>
      <IconWell name="notifications-off-outline" tone="warning" />
      <View style={{ flex: 1, gap: space.sm }}>
        <Text variant="label">الإشعارات مطفية</Text>
        <Text variant="caption" color={colors.ink2}>
          فعّلها حتى يوصلك تأكيد الدفع وتفعيل اشتراكك وردود الدعم أول بأول.
        </Text>
        <Button title={permission === 'denied' ? 'افتح الإعدادات' : 'فعّل الإشعارات'} compact onPress={() => void enable()} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({ card: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' } });
