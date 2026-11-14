import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/src/ui/Text';
import { colors, tabBar } from '@/src/ui/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = ComponentProps<typeof Ionicons>['name'];

/** The three destinations, in order (first sits at the right edge in Arabic). */
export const NAV_TABS: { name: string; icons: [IconName, IconName] }[] = [
  { name: 'index', icons: ['card', 'card-outline'] },
  { name: 'store', icons: ['bag-handle', 'bag-handle-outline'] },
  { name: 'help', icons: ['chatbubbles', 'chatbubbles-outline'] },
];

/**
 * Material 3 navigation bar: flush to the bottom edge, 80 dp plus the system
 * inset, a pill behind the active icon. Only the three destinations show;
 * other routes in the tabs folder (kept for deep links) stay hidden.
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

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${label}، ${badge} جديد` : label}
            testID={`tab-${route.name}`}
            style={styles.item}
          >
            <View style={[styles.pill, focused && styles.pillOn]}>
              <Ionicons name={focused ? tab.icons[0] : tab.icons[1]} size={22} color={focused ? colors.ink : colors.ink3} />
              {badge !== undefined ? (
                <View style={styles.badge}>
                  <Text variant="caption" weight="heavy" color={colors.ink} style={styles.badgeText}>
                    {String(badge)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" weight={focused ? 'bold' : 'medium'} color={focused ? colors.ink : colors.ink3} numberOfLines={1}>
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
    backgroundColor: '#10131D',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 4, minHeight: 56 },
  pill: { width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: 'rgba(36, 86, 230, 0.28)' },
  badge: {
    position: 'absolute',
    top: -2,
    end: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 14 },
});
