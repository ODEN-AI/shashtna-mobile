import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { IconTile, type IconName } from '@/src/ui/IconWell';
import { Text } from '@/src/ui/Text';
import { colors, radius, rgba, space } from '@/src/ui/theme';

/** Shown in place of account-only content while browsing as a guest (Stitch welcome card). */
export function GuestGate({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.card} testID="guest-gate">
      <View style={[styles.glow, styles.glowBlue]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowAmber]} pointerEvents="none" />
      <IconTile name={icon} size={60} filled />
      <Text variant="title" weight="bold" center>
        {title}
      </Text>
      <Text variant="body" color={colors.ink2} center>
        {body}
      </Text>
      <View style={styles.actions}>
        <Button title="تسجيل الدخول" onPress={() => router.push('/login')} testID="gate-login" />
        <Button title="إنشاء حساب جديد" variant="glass" onPress={() => router.push('/register')} testID="gate-register" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: space.md, padding: space.xl, paddingVertical: space.xxl, borderRadius: radius.xl, backgroundColor: colors.surfaceLow, overflow: 'hidden' },
  glow: { position: 'absolute', width: 192, height: 192, borderRadius: 96 },
  glowBlue: { top: -48, start: -48, backgroundColor: rgba(colors.brand, 0.14) },
  glowAmber: { bottom: -40, end: -40, backgroundColor: rgba(colors.amberDeep, 0.1) },
  actions: { alignSelf: 'stretch', gap: space.md, marginTop: space.sm },
});
