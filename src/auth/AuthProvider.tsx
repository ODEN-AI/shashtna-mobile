import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { authApi } from '@/src/api/auth';
import { ApiError, configureApi } from '@/src/api/client';
import type { Session, User } from '@/src/api/types';
import { clearSession, isExpired, readSession, writeSession } from '@/src/auth/session-store';
import { persister } from '@/src/query/client';
import { unregisterPushToken } from '@/src/push/push';

type Status = 'restoring' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: Status;
  user: User | null;
  /** Why the user was signed out automatically (shown on the login screen). */
  signOutReason: string | null;
  signIn: (phone: string, password: string) => Promise<void>;
  register: (input: { name: string; phone: string; password: string; terms: boolean }) => Promise<void>;
  signOut: (reason?: string | null) => Promise<void>;
  updateUser: (user: User) => void;
  /** After a password change the server issues a fresh token for this device. */
  replaceToken: (token: string, expiresAt: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * One Shashtna account (same as the website). The session is restored from
 * the keystore instantly on start, then re-validated with the backend in the
 * background; any 401 from any request signs the user out once.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('restoring');
  const [session, setSession] = useState<Session | null>(null);
  const [signOutReason, setSignOutReason] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const signingOut = useRef(false);

  const applySession = useCallback(async (next: Session) => {
    tokenRef.current = next.token;
    await writeSession(next);
    setSession(next);
    setSignOutReason(null);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(
    async (reason: string | null = null) => {
      if (signingOut.current) return;
      signingOut.current = true;

      try {
        // Needs the token, so it runs before the session is cleared.
        if (tokenRef.current) {
          await unregisterPushToken();
        }
      } finally {
        tokenRef.current = null;
        await clearSession();
        queryClient.clear();
        await persister.removeClient();
        setSession(null);
        setSignOutReason(reason);
        setStatus('signedOut');
        signingOut.current = false;
      }
    },
    [queryClient],
  );

  // Wire the API client to this session.
  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        if (tokenRef.current) {
          void signOut('انتهت جلسة تسجيل الدخول. سجّل دخولك مرة ثانية.');
        }
      },
    });
  }, [signOut]);

  // Restore.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await readSession();

      if (cancelled) return;

      if (!stored || isExpired(stored)) {
        if (stored) await clearSession();
        setStatus('signedOut');
        return;
      }

      tokenRef.current = stored.token;
      setSession(stored);
      setStatus('signedIn');

      // Refresh the profile; a revoked or deleted account signs out via 401.
      authApi
        .me()
        .then(({ user }) => {
          if (!cancelled && tokenRef.current === stored.token) {
            const next = { ...stored, user };
            setSession(next);
            void writeSession(next);
          }
        })
        .catch(() => undefined);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Tokens expire after 30 days; check whenever the app comes back.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && session && isExpired(session)) {
        void signOut('انتهت جلسة تسجيل الدخول. سجّل دخولك مرة ثانية.');
      }
    });
    return () => subscription.remove();
  }, [session, signOut]);

  const signIn = useCallback(
    async (phone: string, password: string) => {
      const result = await authApi.login(phone.trim(), password);
      await applySession(result);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: { name: string; phone: string; password: string; terms: boolean }) => {
      const result = await authApi.register({ ...input, name: input.name.trim(), phone: input.phone.trim() });
      await applySession(result);
    },
    [applySession],
  );

  const updateUser = useCallback((user: User) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      void writeSession(next);
      return next;
    });
  }, []);

  const replaceToken = useCallback(async (token: string, expiresAt: number) => {
    tokenRef.current = token;
    const current = sessionRef.current;

    if (current) {
      const next = { ...current, token, expiresAt };
      sessionRef.current = next;
      setSession(next);
      await writeSession(next);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, signOutReason, signIn, register, signOut, updateUser, replaceToken }),
    [status, session, signOutReason, signIn, register, signOut, updateUser, replaceToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

export function isInvalidCredentials(error: unknown) {
  return error instanceof ApiError && error.code === 'INVALID_CREDENTIALS';
}
