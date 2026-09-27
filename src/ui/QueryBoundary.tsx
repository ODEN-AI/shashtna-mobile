import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ErrorState, LoadingState } from './States';

/**
 * Loading → error (with retry) → content. Cached data is always shown, even
 * if a background refresh fails (the offline banner explains why).
 */
export function QueryBoundary<T>({
  query,
  children,
  rows,
  variant,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  rows?: number;
  variant?: 'cards' | 'hero';
}) {
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return <LoadingState rows={rows} variant={variant} />;
}
