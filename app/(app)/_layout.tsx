import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/src/ui/stackOptions';

export const unstable_settings = { initialRouteName: '(tabs)' };

/**
 * Open to guests and customers: tabs, product details, offers, service
 * status and help. Account-only screens live in the (member) group.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(member)" options={{ headerShown: false }} />
      <Stack.Screen name="packages/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="content/[id]" options={{ title: '' }} />
      <Stack.Screen name="status" options={{ title: 'حالة الخدمة' }} />
      <Stack.Screen name="support/index" options={{ title: 'الدعم والمساعدة' }} />
      <Stack.Screen name="web" options={{ headerShown: false }} />
    </Stack>
  );
}
