import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderRouter } from 'expo-router/testing-library';
import * as Notifications from 'expo-notifications';

import { configureApi } from '@/src/api/client';
import { resetSpotlightSession } from '@/src/features/spotlight/session';
import { ONBOARDING_KEY } from '@/src/onboarding/OnboardingProvider';

import { createBackend, type BackendState } from './fake-backend';

export const listeners = (Notifications as unknown as { __listeners: { received: ((n: unknown) => void)[]; response: ((r: unknown) => void)[] } }).__listeners;

export const secureStore = () => (jest.requireMock('expo-secure-store') as { __store: Map<string, string> }).__store;

export const SESSION = { token: 'tkn', expiresAt: Date.now() + 86_400_000, user: { id: 7, name: 'علي حسن', phone: '07700000000' } };

/** A fresh "install": empty keystore and storage, a new spotlight session. */
export async function resetDevice() {
  listeners.received.length = 0;
  listeners.response.length = 0;
  secureStore().clear();
  await AsyncStorage.clear();
  resetSpotlightSession();
}

/**
 * Starts the whole app (real router, providers and API client) against the
 * in-memory backend. By default onboarding was already completed.
 */
export async function startApp({
  url = '/',
  onboarded = true,
  signedIn = false,
  backend: initial = {},
}: { url?: string; onboarded?: boolean; signedIn?: boolean; backend?: Partial<BackendState> } = {}) {
  const backend = createBackend(initial);
  configureApi({ fetchImpl: backend.fetchImpl as unknown as typeof fetch });

  if (onboarded) await AsyncStorage.setItem(ONBOARDING_KEY, '2026-01-01');
  if (signedIn) {
    backend.state.loggedIn = true;
    secureStore().set('shashtna.session.v1', JSON.stringify(SESSION));
  }

  const screen = renderRouter('./app', { initialUrl: url });
  return { screen, backend };
}

export function authedCalls(backend: ReturnType<typeof createBackend>) {
  return backend.state.calls.filter((call) => !['/api/mobile/catalog', '/api/mobile/content', '/api/mobile/status', '/api/mobile/help'].includes(call.path));
}
