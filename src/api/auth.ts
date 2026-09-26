import { request } from './client';
import type { Session, User } from './types';

export const authApi = {
  login: (phone: string, password: string) =>
    request<Session>('/api/mobile/auth/login', { body: { phone, password }, auth: false }),

  register: (input: { name: string; phone: string; password: string; terms: boolean }) =>
    request<Session>('/api/mobile/auth/register', { body: input, auth: false }),

  requestReset: (phone: string) =>
    request<{ message: string }>('/api/mobile/auth/password-reset/request', { body: { phone }, auth: false }),

  completeReset: (input: { phone: string; code: string; password: string }) =>
    request<{ message: string }>('/api/mobile/auth/password-reset/complete', { body: input, auth: false }),

  me: () => request<{ user: User }>('/api/mobile/me'),

  updateMe: (input: Partial<Pick<User, 'name' | 'preferredContact' | 'renewalReminders' | 'marketingOptIn'>>) =>
    request<{ user: User; message?: string }>('/api/mobile/me', { method: 'PATCH', body: input }),

  /** Signs out other devices; returns a fresh token for this one. */
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string; token: string; expiresAt: number }>('/api/mobile/me/password', { body: { currentPassword, newPassword } }),

  logoutAll: () => request<{ message: string }>('/api/mobile/auth/logout-all', { body: {} }),
};
