import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Text } from './Text';
import { colors, radius, rgba, space } from './theme';

/**
 * Building blocks of the Stitch design (scratch export, 2026-11-15): the
 * days-left ring, pills, icon tiles, section titles and the raised card.
 */

export type MIcon = ComponentProps<typeof MaterialIcons>['name'];

/** Circular "days left" dial: a dim track and a coloured arc for the share of the term still left. */
export function Dial({
  size = 80,
  stroke = 7,
  fraction,
  color,
  gradient,
  children,
  testID,
}: {
  size?: number;
  stroke?: number;
  /** 0–1 of the term still left. */
  fraction: number;
  color?: string;
  /** Two stops for a gradient arc (overrides `color`). */
  gradient?: readonly [string, string];
  children?: ReactNode;
  testID?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(1, fraction));
  const arc = gradient ? 'url(#dialArc)' : (color ?? colors.brand);

  return (
    <View style={{ width: size, height: size }} testID={testID}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {gradient ? (
          <Defs>
            <LinearGradient id="dialArc" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface3} strokeWidth={stroke} fill="none" />
        {shown > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={arc}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference * shown} ${circumference}`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

/** A small rounded-full chip (status, price, tags). */
export function Pill({
  label,
  color = colors.ink2,
  background = colors.surface3,
  icon,
  dot,
  style,
}: {
  label: string;
  color?: string;
  background?: string;
  icon?: MIcon;
  dot?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <MaterialIcons name={icon} size={12} color={color} /> : null}
      <Text variant="micro" color={color} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** A 40 dp rounded square holding an icon, tinted by a colour. */
export function Tile({ icon, color = colors.brandInk, background, size = 40 }: { icon: MIcon; color?: string; background?: string; size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: background ?? rgba(color, 0.14) }]}>
      <MaterialIcons name={icon} size={Math.round(size * 0.55)} color={color} />
    </View>
  );
}

/** Section title row: a bold title at the start, an optional small action at the end. */
export function Heading({ title, action, onAction, icon }: { title: string; action?: string; onAction?: () => void; icon?: MIcon }) {
  return (
    <View style={styles.heading}>
      <View style={styles.headingTitle}>
        {icon ? <MaterialIcons name={icon} size={20} color={colors.amber} /> : null}
        <Text variant="heading" weight="bold" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} disabled={!onAction} hitSlop={10} accessibilityRole={onAction ? 'button' : undefined}>
          <Text variant="micro" color={colors.brandInk}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The Stitch card: surface-container, 12 radius, soft drop shadow; pressable when given onPress. */
export function Panel({
  children,
  onPress,
  tone = 'default',
  style,
  testID,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'low' | 'deep' | 'vip';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const base = [styles.panel, PANEL_TONE[tone], style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={({ pressed }) => [...base, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={base} testID={testID}>
      {children}
    </View>
  );
}

const PANEL_TONE: Record<'default' | 'low' | 'deep' | 'vip', ViewStyle> = {
  default: { backgroundColor: colors.surface },
  low: { backgroundColor: colors.surfaceLow },
  deep: { backgroundColor: colors.canvasDeep },
  vip: { backgroundColor: '#121316', borderWidth: 1, borderColor: rgba(colors.gold, 0.35), boxShadow: '0px 12px 32px rgba(245, 158, 11, 0.12)' },
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tile: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  headingTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  panel: { borderRadius: radius.xl, padding: space.lg, boxShadow: '0px 8px 24px -4px rgba(0, 0, 0, 0.45)' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
});
