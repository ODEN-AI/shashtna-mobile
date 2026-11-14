import { router } from 'expo-router';

/** Opens a website page inside the app (see app/(app)/web.tsx). */
export function openWeb(path: string, title?: string) {
  router.push({ pathname: '/web', params: title ? { path, title } : { path } });
}
