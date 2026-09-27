import AsyncStorage from '@react-native-async-storage/async-storage';

import { EMPTY_HISTORY, planPromo, type PromoPlan, type SpotlightHistory, type SpotlightItem } from '@/src/lib/spotlight';

/**
 * One spotlight decision per cold launch: the history is read once, the plan
 * is made once and kept for the whole session (switching tabs or refreshing
 * never reshuffles it), and the next launch continues the rotation.
 */
export const SPOTLIGHT_KEY = 'shashtna.spotlight.v1';

type Session = { before: SpotlightHistory; plan: PromoPlan | null; saved: boolean };

let session: Session | null = null;
let loading: Promise<Session> | null = null;

function sanitize(value: unknown): SpotlightHistory {
  const raw = value as Partial<SpotlightHistory> | null;
  return {
    recent: Array.isArray(raw?.recent) ? raw.recent.filter((key): key is string => typeof key === 'string').slice(0, 12) : [],
    launches: typeof raw?.launches === 'number' && Number.isFinite(raw.launches) ? Math.max(0, Math.floor(raw.launches)) : 0,
  };
}

export function loadSpotlightSession(): Promise<Session> {
  if (session) return Promise.resolve(session);
  loading ??= AsyncStorage.getItem(SPOTLIGHT_KEY)
    .then((raw) => sanitize(raw ? JSON.parse(raw) : null))
    .catch(() => EMPTY_HISTORY)
    .then((before) => (session = { before, plan: null, saved: false }));
  return loading;
}

function save(history: SpotlightHistory) {
  void AsyncStorage.setItem(SPOTLIGHT_KEY, JSON.stringify(history)).catch(() => undefined);
}

/** This launch's promotion (made on first call, then reused). */
export function promoPlanFor(current: Session, candidates: { offers: SpotlightItem[]; products: SpotlightItem[] }) {
  if (!current.plan) {
    const result = planPromo(candidates, current.before);
    current.plan = result.plan;
    if (!current.saved) {
      current.saved = true;
      save(result.history);
    }
  }
  return current.plan;
}

/** Launch number for rotating the member carousel (counts the launch once). */
export function memberLaunch(current: Session) {
  const launches = current.before.launches + 1;
  if (!current.saved) {
    current.saved = true;
    save({ recent: current.before.recent, launches });
  }
  return launches;
}

/** Tests only: forget this session's decision (a new "cold launch"). */
export function resetSpotlightSession() {
  session = null;
  loading = null;
}
