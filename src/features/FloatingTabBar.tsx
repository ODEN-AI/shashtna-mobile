import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Animated, I18nManager, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { gradientStyle, linear, radial, RGB } from '@/src/ui/gradient';
import { Text } from '@/src/ui/Text';
import { colors, gradients, motion, radius, shadow, space, tabBar } from '@/src/ui/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = ComponentProps<typeof Ionicons>['name'];

export const TAB_ICONS: Record<string, [IconName, IconName]> = {
  index: ['home', 'home-outline'],
  packages: ['sparkles', 'sparkles-outline'],
  orders: ['receipt', 'receipt-outline'],
  notifications: ['notifications', 'notifications-outline'],
  account: ['person-circle', 'person-circle-outline'],
};

const PAD = 6;

/**
 * Floating glass capsule, detached from the screen edge. The active tab sits
 * on a gradient pill that glides between tabs (a native-driver spring; it
 * jumps under reduced motion). Order follows the layout direction, so in
 * Arabic the first tab is on the right. No logo lives here by design.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const count = state.routes.length;
  const itemWidth = width > 0 ? (width - PAD * 2) / count : 0;
  // `start` anchors the pill to the first tab; translate towards the end edge.
  const direction = I18nManager.isRTL ? -1 : 1;

  useEffect(() => {
    if (!itemWidth) return;
    const to = direction * state.index * itemWidth;

    if (reduced) {
      x.setValue(to);
      return;
    }

    Animated.spring(x, { toValue: to, useNativeDriver: true, ...motion.spring }).start();
  }, [state.index, itemWidth, direction, reduced, x]);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) + tabBar.gap - space.sm }]}>
      <View
        style={styles.bar}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        accessibilityRole="tablist"
        testID="floating-tab-bar"
      >
        {itemWidth ? (
          <Animated.View pointerEvents="none" style={[styles.indicator, { width: itemWidth, transform: [{ translateX: x }] }]} testID="tab-indicator" />
        ) : null}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const icons = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

            if (!focused && !event.defaultPrevented) {
              void Haptics.selectionAsync().catch(() => undefined);
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${label}، ${badge} جديد` : label}
              testID={`tab-${route.name}`}
              style={styles.item}
            >
              <View>
                <Ionicons name={focused ? icons[0] : icons[1]} size={22} color={focused ? '#FFFFFF' : colors.ink3} />
                {badge !== undefined ? (
                  <View style={styles.badge}>
                    <Text variant="caption" weight="heavy" color={colors.inkOnLight} style={styles.badgeText}>
                      {String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="caption" weight={focused ? 'bold' : 'medium'} color={focused ? '#FFFFFF' : colors.ink3} numberOfLines={1} style={styles.label}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', start: tabBar.side, end: tabBar.side },
  bar: {
    flexDirection: 'row',
    height: tabBar.height,
    padding: PAD,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(4, 16, 52, 0.94)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
    boxShadow: shadow.float,
    ...gradientStyle(linear(180, ['rgba(203, 233, 253, 0.08)', 'rgba(203, 233, 253, 0.01)'])),
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    start: PAD,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    boxShadow: shadow.glowSoft,
    ...gradientStyle(radial(RGB.ice, 0.3, '50% 0%', '75%'), linear(100, gradients.active)),
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 48 },
  label: { fontSize: 11, lineHeight: 15 },
  badge: {
    position: 'absolute',
    top: -6,
    end: -12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },
  badgeText: { fontSize: 10, lineHeight: 13 },
});
