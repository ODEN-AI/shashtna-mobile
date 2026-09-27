import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';

import { IconWell, type IconName } from './IconWell';
import { Text } from './Text';
import { colors, space, type Tone } from './theme';

export function ListRow({
  icon,
  tone = 'brand',
  title,
  subtitle,
  trailing,
  onPress,
  unread,
}: {
  icon?: IconName;
  tone?: Tone;
  title: string;
  subtitle?: string | null;
  trailing?: ReactNode;
  onPress?: () => void;
  unread?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}، ${subtitle}` : title}
      android_ripple={{ color: 'rgba(203, 233, 253, 0.08)' }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      {icon ? <IconWell name={icon} tone={tone} size={40} /> : null}
      <View style={styles.body}>
        <Text variant="label" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={colors.ink3} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {unread ? <View style={styles.dot} accessibilityLabel="غير مقروء" /> : null}
      {onPress ? <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.ink3} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, minHeight: 56 },
  body: { flex: 1, gap: 2 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.glow },
});
