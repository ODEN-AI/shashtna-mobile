import { router, Stack } from 'expo-router';

import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { EmptyState } from '@/src/ui/States';

/** Unknown deep links land here instead of crashing. */
export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: '' }} />
      <Screen>
        <EmptyState
          icon="compass-outline"
          title="الصفحة غير موجودة"
          body="الرابط غير صحيح أو انتهى."
          action={<Button title="الرئيسية" onPress={() => router.replace('/')} />}
        />
      </Screen>
    </>
  );
}
