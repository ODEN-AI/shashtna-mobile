import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { devicesApi } from '@/src/api/notifications';
import { APP_VERSION, EAS_PROJECT_ID } from '@/src/lib/config';

/**
 * Real remote push through Expo Push Service → FCM (Android) / APNs (iOS).
 *
 * Flow: after sign-in the app asks for permission (in context), gets the
 * Expo push token and registers it with the backend for this account. The
 * backend decides who receives what; the phone only displays and routes.
 * The last registered token is remembered (it is not a secret) so logout can
 * unregister it.
 */

const TOKEN_KEY = 'shashtna.push.token';

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

/** Foreground presentation: show the banner and keep it in the tray. */
export function configureForegroundPresentation() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android channels, matching channelFor() on the server. */
export async function ensureChannels() {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync('account', {
      name: 'طلباتي واشتراكي',
      description: 'تحديثات الطلبات والدفع والتفعيل والدعم',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#2F6BFF',
      vibrationPattern: [0, 200, 120, 200],
    }),
    Notifications.setNotificationChannelAsync('service', {
      name: 'حالة الخدمة',
      description: 'الصيانة والانقطاعات',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FBBF24',
    }),
    Notifications.setNotificationChannelAsync('offers', {
      name: 'العروض والأخبار',
      description: 'العروض والإعلانات من شاشتنا',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
  ]);
}

export function isPushCapable() {
  // Simulators/emulators without Google Play services can't get a push token.
  return Device.isDevice && Platform.OS !== 'web';
}

export async function getPushPermission(): Promise<PushPermission> {
  if (!isPushCapable()) return 'unavailable';
  const settings = await Notifications.getPermissionsAsync();

  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return settings.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (!isPushCapable()) return 'unavailable';
  await ensureChannels();
  const settings = await Notifications.requestPermissionsAsync();

  if (settings.granted) return 'granted';
  return settings.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * Gets the Expo push token and registers it with the backend for the signed-in
 * account. Safe to call on every app start: the backend upserts by token.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!isPushCapable() || (await getPushPermission()) !== 'granted') {
    return null;
  }

  if (!EAS_PROJECT_ID) {
    // Push tokens are tied to an EAS project; see README → Push notifications.
    console.warn('[push] extra.eas.projectId is not configured; skipping push registration');
    return null;
  }

  await ensureChannels();
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });

  await devicesApi.register({
    token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    deviceName: Device.modelName ?? null,
    appVersion: APP_VERSION,
  });

  await AsyncStorage.setItem(TOKEN_KEY, token);
  return token;
}

/** Logout: the backend stops sending this account's notifications here. */
export async function unregisterPushToken() {
  const token = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);

  if (token) {
    await devicesApi.unregister(token).catch(() => undefined);
  }

  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => undefined);
  await Notifications.setBadgeCountAsync(0).catch(() => undefined);
}
