import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking } from 'react-native';

import { notificationsApi } from '@/src/api/notifications';
import { useAuth } from '@/src/auth/AuthProvider';
import { pushHref, readPushData } from '@/src/lib/destinations';
import { queryKeys } from '@/src/query/client';
import {
  configureForegroundPresentation,
  getPushPermission,
  registerPushToken,
  requestPushPermission,
  type PushPermission,
} from '@/src/push/push';

type PushContextValue = {
  permission: PushPermission;
  /** Ask (or, once denied, open system settings). */
  enable: () => Promise<void>;
};

const PushContext = createContext<PushContextValue>({ permission: 'unavailable', enable: async () => undefined });

const ASKED_KEY = 'shashtna.push.asked';

configureForegroundPresentation();

export function PushProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<PushPermission>('undetermined');
  const handledResponse = useRef<string | null>(null);

  const refreshInbox = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }, [queryClient]);

  const register = useCallback(async () => {
    try {
      await registerPushToken();
    } catch (error) {
      // Registration is retried on the next start / foreground.
      console.warn('[push] registration failed', error instanceof Error ? error.message : error);
    }
  }, []);

  // After sign-in: ask once (in context), then register the token.
  useEffect(() => {
    if (status !== 'signedIn') return;
    let cancelled = false;

    (async () => {
      let current = await getPushPermission();

      if (current === 'undetermined' && !(await AsyncStorage.getItem(ASKED_KEY))) {
        await AsyncStorage.setItem(ASKED_KEY, '1');
        current = await requestPushPermission();
      }

      if (cancelled) return;
      setPermission(current);

      if (current === 'granted') await register();
    })();

    return () => {
      cancelled = true;
    };
  }, [status, register]);

  // Re-check when returning from system settings; re-register (token refresh).
  useEffect(() => {
    if (status !== 'signedIn') return;

    const appState = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      const current = await getPushPermission();
      setPermission((previous) => {
        if (previous !== 'granted' && current === 'granted') void register();
        return current;
      });
      refreshInbox();
    });

    const tokenChange = Notifications.addPushTokenListener(() => void register());

    return () => {
      appState.remove();
      tokenChange.remove();
    };
  }, [status, register, refreshInbox]);

  const openResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;

      if (handledResponse.current === id) return;
      handledResponse.current = id;

      const data = readPushData(response.notification.request.content.data);

      if (data?.notificationId) {
        void notificationsApi.markRead(data.notificationId).then(refreshInbox).catch(() => undefined);
      }

      router.push(pushHref(response.notification.request.content.data) as never);
      Notifications.clearLastNotificationResponse();
    },
    [refreshInbox],
  );

  // Foreground arrivals and taps (app open or in background).
  useEffect(() => {
    if (status !== 'signedIn') return;

    const received = Notifications.addNotificationReceivedListener((notification) => {
      refreshInbox();
      const data = readPushData(notification.request.content.data);

      if (data?.type === 'ORDER_STATUS' || data?.type === 'PAYMENT_UPDATE' || data?.type === 'SUBSCRIPTION_ACTIVATED') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        void queryClient.invalidateQueries({ queryKey: ['order'] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions });
      }

      if (data?.type === 'TICKET_REPLY') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.tickets });
        void queryClient.invalidateQueries({ queryKey: ['ticket'] });
      }
    });

    const tapped = Notifications.addNotificationResponseReceivedListener(openResponse);

    // Cold start: the app was launched by tapping a notification.
    const initial = Notifications.getLastNotificationResponse();
    if (initial) openResponse(initial);

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [status, openResponse, refreshInbox, queryClient]);

  const enable = useCallback(async () => {
    if (permission === 'denied') {
      await Linking.openSettings();
      return;
    }

    const next = await requestPushPermission();
    setPermission(next);
    if (next === 'granted') await register();
  }, [permission, register]);

  const value = useMemo(() => ({ permission, enable }), [permission, enable]);

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePush() {
  return useContext(PushContext);
}
