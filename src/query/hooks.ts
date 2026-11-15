import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { catalogApi, contentApi, dashboardApi, helpApi, loyaltyApi, statusApi } from '@/src/api/account';
import { notificationsApi } from '@/src/api/notifications';
import { checkoutApi, ordersApi, subscriptionsApi, type CheckoutParams, type CreateOrderInput, type ProofFile } from '@/src/api/orders';
import { supportApi, type NewTicketInput } from '@/src/api/support';
import type { NotificationPage } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';

import { queryKeys } from './client';

/** Data hooks: every screen reads server state through these. */

function useSignedIn() {
  return useAuth().status === 'signedIn';
}

/** `highlightOrderId`: the order just created at checkout (shown first, like the website). */
export function useDashboard(highlightOrderId?: number | null) {
  return useQuery({
    queryKey: highlightOrderId ? [...queryKeys.dashboard, highlightOrderId] : queryKeys.dashboard,
    queryFn: () => dashboardApi.get(highlightOrderId),
    enabled: useSignedIn(),
  });
}

export function useCheckout(params: CheckoutParams) {
  return useQuery({
    queryKey: ['checkout', params.plan ?? null, params.option ?? null, params.renew ?? null, params.upgrade ?? null, params.device ?? null],
    queryFn: () => checkoutApi.get(params),
    enabled: useSignedIn(),
    // Always resolve against current prices and availability.
    staleTime: 0,
    gcTime: 60_000,
  });
}

/** «نقاط شاشتنا» for the signed-in customer (hidden while the program is off). */
export function useLoyalty(enabled = true) {
  return useQuery({ queryKey: queryKeys.loyalty, queryFn: async () => (await loyaltyApi.get()).loyalty, enabled, staleTime: 60_000 });
}

export function useCatalog() {
  return useQuery({ queryKey: queryKeys.catalog, queryFn: catalogApi.get, staleTime: 60_000 });
}

export function useContent() {
  return useQuery({ queryKey: queryKeys.content, queryFn: contentApi.list });
}

export function useContentItem(id: number) {
  return useQuery({ queryKey: queryKeys.contentItem(id), queryFn: () => contentApi.get(id).then((result) => result.item), enabled: id > 0 });
}

export function useServiceStatus() {
  return useQuery({ queryKey: queryKeys.status, queryFn: statusApi.get });
}

export function useHelp() {
  return useQuery({ queryKey: queryKeys.help, queryFn: helpApi.get, staleTime: 10 * 60_000 });
}

export function useOrders() {
  return useQuery({ queryKey: queryKeys.orders, queryFn: () => ordersApi.list().then((result) => result.orders), enabled: useSignedIn() });
}

export function useOrder(id: number) {
  return useQuery({ queryKey: queryKeys.order(id), queryFn: () => ordersApi.get(id).then((result) => result.order), enabled: useSignedIn() && id > 0 });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: () => subscriptionsApi.list().then((result) => result.subscriptions),
    enabled: useSignedIn(),
  });
}

export function useSubscription(id: number) {
  return useQuery({ queryKey: queryKeys.subscription(id), queryFn: () => subscriptionsApi.get(id), enabled: useSignedIn() && id > 0 });
}

export function useTickets() {
  return useQuery({ queryKey: queryKeys.tickets, queryFn: () => supportApi.list().then((result) => result.tickets), enabled: useSignedIn() });
}

export function useTicket(id: string) {
  return useQuery({ queryKey: queryKeys.ticket(id), queryFn: () => supportApi.get(id).then((result) => result.ticket), enabled: useSignedIn() && Boolean(id) });
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ pageParam }) => notificationsApi.list(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (last: NotificationPage) => last.nextCursor,
    enabled: useSignedIn(),
  });
}

// ------------------------------------------------------------- mutations

/** After anything that changes an order, everything that shows it refreshes. */
function useOrderInvalidation() {
  const client = useQueryClient();

  return (orderId?: number) => {
    void client.invalidateQueries({ queryKey: queryKeys.orders });
    void client.invalidateQueries({ queryKey: queryKeys.dashboard });
    if (orderId) void client.invalidateQueries({ queryKey: queryKeys.order(orderId) });
  };
}

export function useCreateOrder() {
  const client = useQueryClient();
  const invalidate = useOrderInvalidation();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.create(input),
    onSuccess: (result) => {
      client.setQueryData(queryKeys.order(result.order.id), result.order);
      invalidate(result.order.id);
    },
  });
}

export function useCancelOrder(id: number) {
  const client = useQueryClient();
  const invalidate = useOrderInvalidation();

  return useMutation({
    mutationFn: () => ordersApi.cancel(id),
    onSuccess: (result) => {
      if (result.order) client.setQueryData(queryKeys.order(id), result.order);
      invalidate(id);
    },
  });
}

export function useUploadProof(id: number) {
  const client = useQueryClient();
  const invalidate = useOrderInvalidation();

  return useMutation({
    mutationFn: ({ file, reference }: { file: ProofFile; reference?: string }) => ordersApi.uploadProof(id, file, reference),
    onSuccess: (result) => {
      if (result.order) client.setQueryData(queryKeys.order(id), result.order);
      invalidate(id);
    },
  });
}

export function useMarkRead() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: number | 'all') => (id === 'all' ? notificationsApi.markAllRead() : notificationsApi.markRead(id)),
    onMutate: async (id) => {
      // Optimistic: the dot disappears immediately.
      await client.cancelQueries({ queryKey: queryKeys.notifications });
      const now = new Date().toISOString();

      client.setQueryData<{ pages: NotificationPage[]; pageParams: unknown[] }>(queryKeys.notifications, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                unread: id === 'all' ? 0 : Math.max(0, page.unread - (page.notifications.some((item) => item.id === id && !item.readAt) ? 1 : 0)),
                notifications: page.notifications.map((item) => (id === 'all' || item.id === id ? { ...item, readAt: item.readAt ?? now } : item)),
              })),
            }
          : data,
      );
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.notifications });
      void client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useCreateTicket() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: NewTicketInput) => supportApi.create(input),
    onSuccess: (result) => {
      client.setQueryData(queryKeys.ticket(result.ticket.id), result.ticket);
      void client.invalidateQueries({ queryKey: queryKeys.tickets });
    },
  });
}

export function useTicketAction(id: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (action: { reply: string } | { close: true }) =>
      'reply' in action ? supportApi.reply(id, action.reply) : supportApi.close(id),
    onSuccess: (result) => {
      client.setQueryData(queryKeys.ticket(id), result.ticket);
      void client.invalidateQueries({ queryKey: queryKeys.tickets });
    },
  });
}
