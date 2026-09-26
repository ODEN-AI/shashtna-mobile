import { request } from './client';
import type { Ticket, TicketSummary } from './types';

export type NewTicketInput = {
  subject: string;
  category: string;
  message: string;
  orderId?: number;
  subscriptionId?: number;
  diagnostics?: { appVersion: string; os: string; device: string | null; network: string; lastError: string | null };
};

export const supportApi = {
  list: () => request<{ tickets: TicketSummary[] }>('/api/mobile/support/tickets'),
  get: (id: string) => request<{ ticket: Ticket }>(`/api/mobile/support/tickets/${encodeURIComponent(id)}`),
  create: (input: NewTicketInput) => request<{ ticket: Ticket }>('/api/mobile/support/tickets', { body: input }),
  reply: (id: string, message: string) =>
    request<{ ticket: Ticket }>(`/api/mobile/support/tickets/${encodeURIComponent(id)}`, { body: { message } }),
  close: (id: string) =>
    request<{ ticket: Ticket }>(`/api/mobile/support/tickets/${encodeURIComponent(id)}`, { body: { action: 'close' } }),
};
