import { compareVersions, updateState } from '@/src/lib/version';

describe('version', () => {
  it('compares x.y.z numerically', () => {
    expect(compareVersions('2.1.0', '2.0.9')).toBe(1);
    expect(compareVersions('2.1.0', '2.10.0')).toBe(-1);
    expect(compareVersions('2.1', '2.1.0')).toBe(0);
  });

  it('requires an update below the minimum and suggests one below the latest', () => {
    expect(updateState('2.1.0', '2.2.0', '2.2.0')).toBe('required');
    expect(updateState('2.1.0', '2.2.0', '2.0.0')).toBe('suggested');
    expect(updateState('2.2.0', '2.2.0', null)).toBe('none');
    expect(updateState('2.1.0', null, null)).toBe('none');
  });
});
