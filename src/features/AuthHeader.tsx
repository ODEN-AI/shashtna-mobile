import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.logoGlow}>
        <Image source={require('@/assets/icon.png')} style={styles.logo} contentFit="contain" accessibilityLabel="شاشتنا" />
      </View>
      <Text variant="title" center>
        {title}
      </Text>
      <Text color={colors.ink2} center>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, marginBottom: space.xl },
  logoGlow: {
    width: 88,
    height: 88,
    borderRadius: 26,
    marginBottom: space.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    shadowColor: colors.glow,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: { width: 64, height: 64, borderRadius: 16 },
});
