import { useEffect, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

/** True when the OS asks apps to minimise motion; animations then jump to their end state. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => mounted && setReduced(Boolean(value)))
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => setReduced(Boolean(value)));
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reduced;
}

/**
 * Whether ambient (looping) motion may run: not under reduced motion, and
 * only while the screen is focused — tabs stay mounted in the background.
 */
export function useAmbientMotion() {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  return !reduced && focused;
}
