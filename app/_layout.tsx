import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, router, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/src/auth/AuthProvider';
import { takePendingRedirect } from '@/src/auth/redirect';
import { APP_VERSION } from '@/src/lib/config';
import { recordError } from '@/src/lib/diagnostics';
import { OnboardingProvider, useOnboarding } from '@/src/onboarding/OnboardingProvider';
import { PushProvider } from '@/src/push/PushProvider';
import { createQueryClient, persister, shouldPersistQuery, wireQueryToDevice } from '@/src/query/client';
import { Button } from '@/src/ui/Button';
import { EmptyState } from '@/src/ui/States';
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
    card: colors.canvas,
    text: colors.ink,
    border: colors.line,
    notification: colors.glow,
  },
};

export const unstable_settings = { initialRouteName: '(app)' };

/**
 * Navigation follows the state matrix:
 *  - first launch → onboarding (once) → guest home
 *  - guests browse home, packages, product details, offers, status and help;
 *    account screens (checkout, orders, subscriptions…) ask them to sign in
 *  - login/register exist only while signed out
 */
function RootNavigator() {
  const { status, signOutReason } = useAuth();
  const onboarding = useOnboarding();
  const previous = useRef(status);

  useEffect(() => {
    if (status !== 'restoring' && onboarding.status !== 'loading') {
      SplashScreen.hide();
    }
  }, [status, onboarding.status]);

  // Auth transitions: continue where a guest was headed after signing in;
  // after signing out, land on the guest home (or on login when the session
  // was ended for them, so they see why).
  useEffect(() => {
    const before = previous.current;
    previous.current = status;

    if (before === 'signedOut' && status === 'signedIn') {
      const next = takePendingRedirect();
      if (next) setTimeout(() => router.push(next), 0);
    }

    if (before === 'signedIn' && status === 'signedOut') {
      setTimeout(() => {
        if (router.canDismiss()) router.dismissAll();
        // `navigate` never stacks a second login screen if one is already shown.
        if (signOutReason) router.navigate('/login');
        else router.replace('/');
      }, 0);
    }
  }, [status, signOutReason]);

  if (status === 'restoring' || onboarding.status === 'loading') {
    return null;
  }

  const signedIn = status === 'signedIn';
  const onboarded = onboarding.status === 'done';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'fade' }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(app)" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
        </Stack.Protected>
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
          <OnboardingProvider>
            <PushProvider>
              <ToastProvider>
                <ThemeProvider value={navigationTheme}>
                  <StatusBar style="light" />
                  <RootNavigator />
                </ThemeProvider>
              </ToastProvider>
            </PushProvider>
          </OnboardingProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Last line of defence: a render error shows a recoverable screen instead of
 * closing the app, and is remembered (scrubbed) for support diagnostics.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => recordError('render', error), [error]);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.canvas }}>
      <EmptyState
        icon="warning-outline"
        tone="danger"
        title="صار خطأ غير متوقع"
        body="حاول مرة ثانية. إذا تكرر، افتح تذكرة دعم وراح نشوف السبب."
        action={<Button title="إعادة المحاولة" icon="refresh" onPress={() => void retry()} />}
      />
    </SafeAreaProvider>
  );
}
