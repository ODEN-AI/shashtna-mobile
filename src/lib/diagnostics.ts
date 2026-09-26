import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { APP_VERSION } from './config';

/**
 * Non-sensitive facts attached to support tickets so staff can help faster:
 * app version, OS, device model, network type and the last app error.
 * Error text is scrubbed of anything that looks like a token, URL query or
 * long number before it is kept.
 */

const KEY = 'shashtna.lastError';

export function scrub(message: string) {
  return message
    .replace(/Bearer\s+[\w.-]+/gi, 'Bearer ***')
    .replace(/ExponentPushToken\[[^\]]*\]/g, 'ExponentPushToken[***]')
    .replace(/\?[^\s]*/g, '?***')
    .replace(/\d{6,}/g, '***')
    .slice(0, 200);
}

export function recordError(source: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const entry = `${source}: ${scrub(message)} (${new Date().toISOString().slice(0, 16)})`;
  void AsyncStorage.setItem(KEY, entry).catch(() => undefined);
}

export async function collectDiagnostics() {
  const [network, lastError] = await Promise.all([
    NetInfo.fetch()
      .then((state) => `${state.type}${state.isInternetReachable === false ? ' (بدون إنترنت)' : ''}`)
      .catch(() => 'unknown'),
    AsyncStorage.getItem(KEY).catch(() => null),
  ]);

  return {
    appVersion: APP_VERSION,
    os: `${Platform.OS} ${Platform.Version}`,
    device: Device.modelName ?? null,
    network,
    lastError: lastError ?? null,
  };
}
