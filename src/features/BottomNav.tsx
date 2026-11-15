import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/src/ui/Text';
import { colors, tabBar } from '@/src/ui/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = ComponentProps<typeof MaterialIcons>['name'];

/** The five destinations from the Stitch design, in order (the first sits at the right edge in Arabic). */
export const NAV_TABS: { name: string; icon: IconName; raised?: boolean }[] = [
  { name: 'index', icon: 'home' },
  { name: 'packages', icon: 'widgets' },
  { name: 'subscription', icon: 'live-tv', raised: true },
  { name: 'support', icon: 'support-agent' },
  { name: 'account', icon: 'account-circle' },
];

const RAISED = { backgroundColor: colors.brand };

/**
 * Stitch navigation bar: deep navy, five destinations; «اشتراكي» is a raised
 * cobalt circle in the middle. Other routes in the tabs folder (kept for deep
 * links) stay hidden.
 */
export function BottomNav({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: tabBar.height + insets.bottom }]} accessibilityRole="tablist" testID="bottom-nav">
      {NAV_TABS.map((tab) => {
        const index = state.routes.findIndex((route) => route.name === tab.name);

        if (index === -1) return null;

        const route = state.routes[index];
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const badge = options.tabBarBadge;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

          if (!focused && !event.defaultPrevented) {
            void Haptics.selectionAsync().catch(() => undefined);
            navigation.navigate(route.name, route.params);
          }
        };

        const a11y = {
          accessibilityRole: 'tab' as const,
          accessibilityState: { selected: focused },
          accessibilityLabel: badge ? `${label}، ${badge} جديد` : label,
          testID: `tab-${route.name}`,
        };

        if (tab.raised) {
          return (
            <View key={route.key} style={styles.item}>
              <Pressable onPress={onPress} {...a11y} style={({ pressed }) => [styles.raised, RAISED, pressed && styles.pressed]}>
                <MaterialIcons name={tab.icon} size={26} color={colors.onBrand} />
                <Text variant="micro" color={colors.onBrand}>
                  {label}
                </Text>
              </Pressable>
            </View>
          );
        }

        const tint = focused ? colors.brandInk : colors.ink2;

        return (
          <Pressable key={route.key} onPress={onPress} {...a11y} style={styles.item}>
            <View>
              <MaterialIcons name={tab.icon} size={24} color={tint} />
              {badge !== undefined ? <View style={styles.badge} /> : null}
            </View>
            <Text variant="micro" weight={focused ? 'semibold' : 'regular'} color={tint} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(8, 14, 30, 0.96)',
    boxShadow: '0px -4px 24px rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 4,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56 },
  raised: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    boxShadow: '0px 8px 20px rgba(37, 99, 235, 0.45)',
  },
  pressed: { transform: [{ scale: 0.95 }] },
  badge: {
    position: 'absolute',
    top: 0,
    end: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dangerStrong,
    borderWidth: 2,
    borderColor: colors.canvasDeep,
  },
});
