import { request } from './client';
import type { Checkout, ContactOption, Order, OrderDetail, RequestType, Subscription, SubscriptionDetail } from './types';

export type CheckoutParams = { plan?: string; renew?: number; upgrade?: number; device?: number };

export type CreateOrderInput = {
  requestType: RequestType;
  planSlug?: string;
  deviceId?: number;
  contactMethod: ContactOption;
  subscriptionId?: number;
  customerNote?: string;
};

export type ProofFile = { uri: string; name: string; type: 'image/jpeg' | 'image/png' | 'image/webp' };

export const checkoutApi = {
  get: (params: CheckoutParams) => {
    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    return request<Checkout>(`/api/mobile/checkout?${query}`);
  },
};

export const ordersApi = {
  list: () => request<{ orders: Order[] }>('/api/mobile/orders'),

  get: (id: number) => request<{ order: OrderDetail }>(`/api/mobile/orders/${id}`),

  /** The price is never sent: the backend prices the order from the database. */
  create: (input: CreateOrderInput) =>
    request<{ order: OrderDetail; alreadyExists: boolean }>('/api/mobile/orders', { body: input }),

  cancel: (id: number) => request<{ order: OrderDetail; message: string }>(`/api/mobile/orders/${id}/cancel`, { body: {} }),

  uploadProof: (id: number, file: ProofFile, paymentReference?: string) => {
    const form = new FormData();
    // React Native's FormData accepts { uri, name, type } file descriptors.
    form.append('paymentProof', file as unknown as Blob);

    if (paymentReference?.trim()) {
      form.append('paymentReference', paymentReference.trim());
    }

    return request<{ order: OrderDetail; message: string }>(`/api/mobile/orders/${id}/proof`, {
      method: 'POST',
      form,
      timeoutMs: 60_000,
    });
  },

  proofPath: (id: number) => `/api/mobile/orders/${id}/proof`,
};

export const subscriptionsApi = {
  list: () => request<{ subscriptions: Subscription[] }>('/api/mobile/subscriptions'),
  get: (id: number) => request<SubscriptionDetail>(`/api/mobile/subscriptions/${id}`),
};
