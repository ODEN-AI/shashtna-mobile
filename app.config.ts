/// <reference types="node" />
import type { ConfigContext, ExpoConfig } from 'expo/config';
import { existsSync } from 'node:fs';

/**
 * Build-time configuration on top of app.json. Nothing secret is committed:
 *
 *   EAS_PROJECT_ID          Expo project id (push tokens). `eas init` prints it.
 *   GOOGLE_SERVICES_JSON    path to google-services.json (Firebase / FCM for
 *                           Android push). On EAS, upload the file as a "file"
 *                           environment variable with this name.
 *   EXPO_PUBLIC_API_URL     backend URL override for local testing builds only;
 *                           production builds use extra.apiBaseUrl.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? (existsSync('./google-services.json') ? './google-services.json' : undefined);
  const projectId = process.env.EAS_PROJECT_ID ?? config.extra?.eas?.projectId ?? '';

  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    extra: {
      ...config.extra,
      eas: { ...config.extra?.eas, projectId },
    },
  };
};
