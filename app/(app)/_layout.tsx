import { Stack } from 'expo-router';

import { colors } from '@/src/ui/theme';

/** Signed-in area: tabs plus detail screens pushed on top. */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="packages/[slug]" options={{ title: 'تفاصيل الباقة' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'تفاصيل الطلب' }} />
      <Stack.Screen name="subscriptions/index" options={{ title: 'اشتراكاتي' }} />
      <Stack.Screen name="subscriptions/[id]" options={{ title: 'تفاصيل الاشتراك' }} />
      <Stack.Screen name="content/[id]" options={{ title: '' }} />
      <Stack.Screen name="status" options={{ title: 'حالة الخدمة' }} />
      <Stack.Screen name="support/index" options={{ title: 'الدعم والمساعدة' }} />
      <Stack.Screen name="support/new" options={{ title: 'تذكرة جديدة', presentation: 'modal' }} />
      <Stack.Screen name="support/[id]" options={{ title: 'التذكرة' }} />
      <Stack.Screen name="notification/[id]" options={{ title: 'الإشعار' }} />
      <Stack.Screen name="account/profile" options={{ title: 'بياناتي' }} />
      <Stack.Screen name="account/password" options={{ title: 'تغيير كلمة المرور' }} />
    </Stack>
  );
}
