import { Stack } from 'expo-router';

import { colors } from '@/src/ui/theme';

/** Login, register and password reset share the deep-blue auth backdrop. */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvasDeep }, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
