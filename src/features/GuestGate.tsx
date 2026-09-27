import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { IconTile, type IconName } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, gradients, space } from '@/src/ui/theme';

/** Shown in place of account-only content while browsing as a guest. */
export function GuestGate({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <GradientSurface stops={gradients.heroDeep} style={styles.card} testID="guest-gate">
      <IconTile name={icon} size={60} filled />
      <Text variant="heading" center>
        {title}
      </Text>
      <Text color={colors.ice} center>
        {body}
      </Text>
      <View style={styles.actions}>
        <Button title="تسجيل الدخول" variant="light" onPress={() => router.push('/login')} testID="gate-login" />
        <Button title="إنشاء حساب جديد" variant="glass" onPress={() => router.push('/register')} testID="gate-register" />
      </View>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: space.md, padding: space.xl, paddingVertical: space.xxl },
  actions: { alignSelf: 'stretch', gap: space.md, marginTop: space.sm },
});
