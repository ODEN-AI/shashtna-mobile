import Constants from 'expo-constants';

/**
 * The backend (the Shashtna website) is the single source of truth. Its base
 * URL comes from app.json → extra.apiBaseUrl and can be overridden for local
 * development with EXPO_PUBLIC_API_URL (e.g. http://192.168.1.10:3000).
 * Only public configuration lives here; no secrets ship in the app.
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const fromConfig = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  return String(fromEnv || fromConfig || 'https://shashtna.netlify.app').replace(/\/+$/, '');
}

export const API_BASE_URL = resolveBaseUrl();

export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export const EAS_PROJECT_ID =
  (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
  Constants.easConfig?.projectId ||
  '';
