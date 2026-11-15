import { Tabs } from 'expo-router';

import { BottomNav } from '@/src/features/BottomNav';
import { colors } from '@/src/ui/theme';

/**
 * Five destinations from the Stitch design: الرئيسية · الباقات · اشتراكي
 * (raised, in the middle) · الدعم · حسابي. Older tab screens stay as hidden
 * routes so links and notifications that point at them still work.
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
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="packages" options={{ title: 'الباقات' }} />
      <Tabs.Screen name="subscription" options={{ title: 'اشتراكي' }} />
      <Tabs.Screen name="support" options={{ title: 'الدعم' }} />
      <Tabs.Screen name="account" options={{ title: 'حسابي' }} />
      <Tabs.Screen name="store" options={{ href: null, title: 'المتجر' }} />
      <Tabs.Screen name="orders" options={{ href: null, title: 'طلباتي' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'الإشعارات' }} />
    </Tabs>
  );
}
