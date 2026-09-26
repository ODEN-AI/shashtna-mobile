/// <reference types="node" />
import type { ConfigContext, ExpoConfig } from 'expo/config';
import { existsSync } from 'node:fs';

/**
 * Dynamic config on top of app.json (every app.json setting is kept as is).
 * Nothing secret is committed:
 *
 *   GOOGLE_SERVICES_JSON  EAS "file" environment variable: during an EAS build
 *                         it holds the path of the uploaded google-services.json
 *                         (Firebase / FCM for Android push). Locally, the
 *                         git-ignored ./google-services.json is used if present.
 *   EXPO_PUBLIC_API_URL   backend URL override for local testing builds only;
 *                         production builds use extra.apiBaseUrl.
 *
 * The EAS project id stays in app.json (extra.eas.projectId).
 */
function resolveGoogleServicesFile() {
  const fromEnv = process.env.GOOGLE_SERVICES_JSON?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  // Only reference the local file when it exists, so configs resolve (and
  // prebuild works) on machines without Firebase credentials.
  return existsSync('./google-services.json') ? './google-services.json' : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile = resolveGoogleServicesFile();

  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
