import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, hitSlop, space } from './theme';

/** SectionHeader — a title with an optional eyebrow and "see all" action. */
export function SectionHeader({ title, eyebrow, action, onAction }: { title: string; eyebrow?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow ? (
          <Text variant="caption" color={colors.brandInk} weight="bold">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={hitSlop} accessibilityRole="link" style={styles.action}>
          <Text variant="label" color={colors.brandInk}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Section({
  title,
  eyebrow,
  action,
  onAction,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} eyebrow={eyebrow} action={action} onAction={onAction} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
  action: { minHeight: 32, justifyContent: 'center' },
});
