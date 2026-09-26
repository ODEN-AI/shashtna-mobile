import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/src/api/types';

/**
 * The session token lives only in the platform keystore (Android Keystore /
 * iOS Keychain) via expo-secure-store — never in AsyncStorage. Passwords are
 * never stored at all.
 */
const KEY = 'shashtna.session.v1';

export async function readSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;

    if (!session?.token || !session.user?.id || !Number.isFinite(session.expiresAt)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function writeSession(session: Session) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(KEY).catch(() => undefined);
}

/** Tokens are refused a minute before they actually expire. */
export function isExpired(session: Pick<Session, 'expiresAt'>, now = Date.now()) {
  return session.expiresAt - 60_000 <= now;
}
