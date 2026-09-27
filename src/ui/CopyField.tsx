import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useToast } from './Toast';
import { colors, radius, space } from './theme';

/** A value the customer needs to copy (transfer number, username...). */
export function CopyField({ label, value, secret, revealed }: { label: string; value: string; secret?: boolean; revealed?: boolean }) {
  const toast = useToast();
  const shown = secret && !revealed ? '•'.repeat(Math.min(12, Math.max(6, value.length))) : value;

  return (
    <View style={styles.box}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" color={colors.ink3}>
          {label}
        </Text>
        <Text variant="mono" selectable={!secret || revealed}>
          {shown}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`نسخ ${label}`}
        onPress={async () => {
          await Clipboard.setStringAsync(value);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          toast('تم النسخ');
        }}
        style={({ pressed }) => [styles.copy, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="copy-outline" size={18} color={colors.brandInk} />
        <Text variant="label" color={colors.brandInk}>
          نسخ
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(1, 6, 25, 0.3)',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(25, 81, 252, 0.18)',
    minHeight: 40,
  },
});
