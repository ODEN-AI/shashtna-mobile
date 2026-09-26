import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/src/auth/AuthProvider';
import { APP_VERSION } from '@/src/lib/config';
import { PushProvider } from '@/src/push/PushProvider';
import { createQueryClient, persister, shouldPersistQuery, wireQueryToDevice } from '@/src/query/client';
import { ToastProvider } from '@/src/ui/Toast';
import { colors } from '@/src/ui/theme';

// Arabic-first: the native builds are forced RTL by the expo-localization
// plugin (app.json); this covers development clients as well.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

void SplashScreen.preventAutoHideAsync();
wireQueryToDevice();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brand,
    background: colors.canvas,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.glow,
  },
};

export const unstable_settings = { initialRouteName: '(app)' };

function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'restoring') {
      SplashScreen.hide();
    }
  }, [status]);

  if (status === 'restoring') {
    return null;
  }

  const signedIn = status === 'signedIn';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'fade' }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.canvas }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 24 * 60 * 60 * 1000,
          buster: APP_VERSION,
          dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        }}
      >
        <AuthProvider>
          <PushProvider>
            <ToastProvider>
              <ThemeProvider value={navigationTheme}>
                <StatusBar style="light" />
                <RootNavigator />
              </ThemeProvider>
            </ToastProvider>
          </PushProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
