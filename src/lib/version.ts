/** Compares x.y.z versions; anything unparseable counts as 0. */
export function compareVersions(a: string, b: string) {
  const parts = (value: string) => value.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const left = parts(a);
  const right = parts(b);

  for (let index = 0; index < 3; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
}

export type UpdateState = 'none' | 'suggested' | 'required';

/** Required below the minimum version, suggested below the latest; an APK never updates itself. */
export function updateState(current: string, latest: string | null | undefined, min: string | null | undefined): UpdateState {
  if (min && compareVersions(current, min) < 0) return 'required';
  if (latest && compareVersions(current, latest) < 0) return 'suggested';
  return 'none';
}
