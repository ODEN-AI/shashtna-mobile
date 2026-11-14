import { Stack, useLocalSearchParams } from 'expo-router';

import { WebPage } from '@/src/features/web/WebPage';

/** Any allow-listed website page inside the app: /web?path=/points&title=نقاطي */
export default function WebScreen() {
  const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>();
  const safePath = typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/dashboard';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WebPage path={safePath} title={typeof title === 'string' ? title : undefined} />
    </>
  );
}
