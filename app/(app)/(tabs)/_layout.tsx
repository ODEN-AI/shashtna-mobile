import { Tabs } from 'expo-router';

import { BottomNav } from '@/src/features/BottomNav';
import { colors } from '@/src/ui/theme';

/**
 * Three destinations (council decision, 2026-11-14): «اشتراكي» (the card,
 * renewal and the current order), «المتجر» (the website's plans inside the
 * app) and «مساعدة» (chat, tickets, account). The older tab screens stay as
 * hidden routes so links and notifications that point at them still work.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'اشتراكي' }} />
      <Tabs.Screen name="store" options={{ title: 'المتجر' }} />
      <Tabs.Screen name="help" options={{ title: 'مساعدة' }} />
      <Tabs.Screen name="packages" options={{ href: null, title: 'الباقات' }} />
      <Tabs.Screen name="orders" options={{ href: null, title: 'طلباتي' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'الإشعارات' }} />
      <Tabs.Screen name="account" options={{ href: null, title: 'حسابي' }} />
    </Tabs>
  );
}
