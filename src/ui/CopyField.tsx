import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, radius, rgba, space } from './theme';

/**
 * Stitch "copyable credential tile": the label in small muted blue, the value
 * large in Latin digits (left to right), and a «نسخ» pill that turns into
 * «تم النسخ» for a moment. Secrets stay masked until revealed by the caller.
 */
export function CopyField({ label, value, secret, revealed }: { label: string; value: string; secret?: boolean; revealed?: boolean }) {
  const [copied, setCopied] = useState(false);
  const hidden = secret && !revealed;
  const shown = hidden ? '•'.repeat(Math.min(12, Math.max(6, value.length))) : value;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <View style={styles.box}>
      <View style={styles.body}>
        <Text variant="caption" color={colors.brandInk}>
          {label}
        </Text>
        <Text variant="mono" selectable={!hidden} numberOfLines={2} style={styles.value}>
          {shown}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copied ? 'تم النسخ' : `نسخ ${label}`}
        onPress={async () => {
          await Clipboard.setStringAsync(value);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          setCopied(true);
        }}
        style={({ pressed }) => [styles.copy, copied && styles.copied, pressed && { opacity: 0.8 }]}
      >
        <MaterialIcons name={copied ? 'check' : 'content-copy'} size={16} color={copied ? colors.success : colors.brandInk} />
        <Text variant="label" color={copied ? colors.success : colors.brandInk}>
          {copied ? 'تم النسخ' : 'نسخ'}
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
    paddingStart: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
  },
  body: { flex: 1, gap: 2 },
  value: { textAlign: 'left' },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: rgba(colors.brand, 0.18),
  },
  copied: { backgroundColor: rgba(colors.success, 0.15) },
});
