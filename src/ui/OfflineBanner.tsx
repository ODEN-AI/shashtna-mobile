import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useOnline } from '@/src/hooks/useOnline';

import { Text } from './Text';
import { colors, space } from './theme';

export function OfflineBanner() {
  const online = useOnline();

  if (online) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
      <Text variant="caption" color={colors.warning}>
        أنت غير متصل — نعرض آخر بيانات محفوظة
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
});
