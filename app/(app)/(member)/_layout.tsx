import { Redirect, Stack, useGlobalSearchParams, useSegments } from 'expo-router';

import { useAuth } from '@/src/auth/AuthProvider';
import { hrefFromSegments, setPendingRedirect } from '@/src/auth/redirect';
import { HeaderBack } from '@/src/ui/HeaderBack';
import { stackScreenOptions } from '@/src/ui/stackOptions';

/**
 * Account-only screens. A guest (or a deep link while signed out) is sent to
 * login first and continues here right after signing in.
 */
export default function MemberLayout() {
  const { status } = useAuth();
  const segments = useSegments();
  const params = useGlobalSearchParams();

  if (status !== 'signedIn') {
    // While redirecting, the layout can render once more without its child
    // route; only a full route is remembered.
    const target = segments.some((segment) => !segment.startsWith('(')) ? hrefFromSegments(segments, params) : null;
    if (target) setPendingRedirect(target);
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ ...stackScreenOptions, headerLeft: () => <HeaderBack /> }}>
      <Stack.Screen name="checkout" options={{ title: 'تأكيد الطلب' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'تفاصيل الطلب' }} />
      <Stack.Screen name="subscriptions/index" options={{ title: 'اشتراكاتي' }} />
      <Stack.Screen name="subscriptions/[id]" options={{ title: 'تفاصيل الاشتراك' }} />
      <Stack.Screen name="support/new" options={{ title: 'تذكرة جديدة', presentation: 'modal' }} />
      <Stack.Screen name="support/[id]" options={{ title: 'التذكرة' }} />
      <Stack.Screen name="notification/[id]" options={{ title: 'الإشعار' }} />
      <Stack.Screen name="account/profile" options={{ title: 'بياناتي' }} />
      <Stack.Screen name="account/password" options={{ title: 'تغيير كلمة المرور' }} />
      <Stack.Screen name="account/notifications-check" options={{ title: 'فحص الإشعارات' }} />
    </Stack>
  );
}
