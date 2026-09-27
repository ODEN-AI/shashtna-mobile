import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * First-launch onboarding: shown once, then never again on this phone
 * (completing or skipping both count). Stored locally only.
 */
export const ONBOARDING_KEY = 'shashtna.onboarding.v1';

type Status = 'loading' | 'pending' | 'done';

const OnboardingContext = createContext<{ status: Status; complete: () => void }>({ status: 'done', complete: () => undefined });

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => !cancelled && setStatus(value ? 'done' : 'pending'))
      // Storage failure must never trap the user in onboarding.
      .catch(() => !cancelled && setStatus('done'));
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = useCallback(() => {
    setStatus('done');
    void AsyncStorage.setItem(ONBOARDING_KEY, new Date().toISOString()).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ status, complete }), [status, complete]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
