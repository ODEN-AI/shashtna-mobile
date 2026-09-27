import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from './AuthProvider';
import { setPendingRedirect } from './redirect';

/**
 * `go(href)`: open an account-only screen, asking a guest to sign in first
 * and continuing there afterwards.
 */
export function useRequireAuth() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  const go = useCallback(
    (href: Href) => {
      if (signedIn) {
        router.push(href);
        return;
      }
      setPendingRedirect(href);
      router.push('/login');
    },
    [signedIn],
  );

  return { signedIn, go };
}
