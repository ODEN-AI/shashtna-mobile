import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, focusManager, onlineManager, type Query } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/src/api/client';

/**
 * Server state lives in TanStack Query:
 * - cached data is shown instantly on start and refreshed in the background
 * - refetch when the app returns to the foreground or the network comes back
 * - failed requests retry only when it makes sense (network / 5xx)
 * No polling: urgent changes arrive by push, which invalidates the queries.
 */

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  catalog: ['catalog'] as const,
  content: ['content'] as const,
  contentItem: (id: number) => ['content', id] as const,
  status: ['status'] as const,
  orders: ['orders'] as const,
  order: (id: number) => ['order', id] as const,
  subscriptions: ['subscriptions'] as const,
  subscription: (id: number) => ['subscription', id] as const,
  notifications: ['notifications'] as const,
  tickets: ['tickets'] as const,
  ticket: (id: string) => ['ticket', id] as const,
  help: ['help'] as const,
  me: ['me'] as const,
};

/**
 * Only non-secret data is written to disk. Subscription details (they carry
 * IPTV login credentials) and the account profile are kept in memory only.
 */
const PERSISTED = new Set(['dashboard', 'catalog', 'content', 'status', 'orders', 'order', 'subscriptions', 'notifications', 'tickets', 'help']);

export function shouldPersistQuery(query: Pick<Query, 'queryKey' | 'state'>) {
  return query.state.status === 'success' && PERSISTED.has(String(query.queryKey[0]));
}

export function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError) {
    return error.retryable && failureCount < 2;
  }

  return failureCount < 1;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 24 * 60 * 60 * 1000,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  });
}

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'shashtna.cache.v1',
  throttleTime: 1500,
});

let wired = false;

/** Connects TanStack Query to React Native's app state and connectivity. */
export function wireQueryToDevice() {
  if (wired) return;
  wired = true;

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    }),
  );

  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') handleFocus(status === 'active');
    });
    return () => subscription.remove();
  });
}
