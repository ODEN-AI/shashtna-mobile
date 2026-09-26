import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboard } from '@/src/query/hooks';
import { colors } from '@/src/ui/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const unread = useDashboard().data?.unreadNotifications ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="packages" options={{ title: 'الباقات', tabBarIcon: icon('sparkles', 'sparkles-outline') }} />
      <Tabs.Screen name="orders" options={{ title: 'طلباتي', tabBarIcon: icon('receipt', 'receipt-outline') }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'الإشعارات',
          tabBarIcon: icon('notifications', 'notifications-outline'),
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.glow, color: colors.canvas, fontWeight: '800' },
        }}
      />
      <Tabs.Screen name="account" options={{ title: 'حسابي', tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
