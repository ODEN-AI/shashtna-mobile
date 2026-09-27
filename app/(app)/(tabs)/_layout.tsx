import { Tabs } from 'expo-router';

import { useAuth } from '@/src/auth/AuthProvider';
import { FloatingTabBar } from '@/src/features/FloatingTabBar';
import { useDashboard } from '@/src/query/hooks';
import { colors } from '@/src/ui/theme';

export default function TabsLayout() {
  const signedIn = useAuth().status === 'signedIn';
  const unread = useDashboard().data?.unreadNotifications ?? 0;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="packages" options={{ title: 'الباقات' }} />
      <Tabs.Screen name="orders" options={{ title: 'طلباتي' }} />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'الإشعارات', tabBarBadge: signedIn && unread > 0 ? (unread > 99 ? '99+' : unread) : undefined }}
      />
      <Tabs.Screen name="account" options={{ title: signedIn ? 'حسابي' : 'الإعدادات' }} />
    </Tabs>
  );
}
