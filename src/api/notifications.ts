import { request } from './client';
import type { NotificationPage } from './types';

export const notificationsApi = {
  list: (before?: number | null) =>
    request<NotificationPage>(`/api/mobile/notifications${before ? `?before=${before}` : ''}`),

  markRead: (id: number) => request<{ unread: number }>('/api/mobile/notifications/read', { body: { id } }),

  markAllRead: () => request<{ unread: number }>('/api/mobile/notifications/read', { body: { all: true } }),
};

export const devicesApi = {
  register: (input: { token: string; platform: 'ANDROID' | 'IOS'; deviceName?: string | null; appVersion?: string }) =>
    request<{ deviceId: number | null }>('/api/mobile/devices', { body: input }),

  unregister: (token: string) =>
    request<Record<string, never>>('/api/mobile/devices', { method: 'DELETE', body: { token }, timeoutMs: 5_000 }),
};
