import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { colors, radius, space } from './theme';

/** A titled group of settings rows on one Stitch card (surface-container, 12 radius), with hairline dividers. */
export function SettingsGroup({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={{ gap: space.sm }}>
      {title ? (
        <Text variant="heading" weight="bold" style={styles.title} accessibilityRole="header">
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
  panel: { paddingHorizontal: space.lg, borderRadius: radius.xl, backgroundColor: colors.surface, boxShadow: '0px 8px 24px -4px rgba(0, 0, 0, 0.45)' },
  divider: { height: 1, backgroundColor: colors.surface2, marginStart: 52 },
});
