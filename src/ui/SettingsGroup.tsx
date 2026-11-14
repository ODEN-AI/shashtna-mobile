import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, radius, space } from './theme';

/** A titled group of settings rows on one calm glass panel, with hairline dividers. */
export function SettingsGroup({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={{ gap: space.sm }}>
      {title ? (
        <Text variant="caption" weight="bold" color={colors.ink3} style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View style={styles.panel}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text variant="caption" color={colors.ink3} style={styles.title}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: space.xs },
  panel: {
    paddingHorizontal: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
  },
  divider: { height: 1, backgroundColor: colors.line, marginStart: 52 },
});
