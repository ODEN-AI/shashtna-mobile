import { request } from './client';

/**
 * App → website sign-in handoff (website: docs/app-handoff.md). A one-time
 * code (60 s) the in-app browser POSTs to /app/handoff so website pages open
 * already signed in, in the website's app mode.
 */
export const webSessionApi = {
  create: () => request<{ code: string; expiresIn: number }>('/api/mobile/web-session', { method: 'POST', body: {} }),
};

export type AppConfig = {
  customerApp?: { latestVersion: string | null; minVersion: string | null; downloadUrl: string | null };
  support?: { whatsapp: string | null; telegram: string | null; phone: string | null };
};

/** Public remote configuration (update check and support links). */
export const configApi = {
  get: () => request<AppConfig>('/api/mobile/config', { auth: false, timeoutMs: 8_000 }),
};
