import { formatPrice, formatRelative, pluralDays, toDate } from '@/src/lib/format';

describe('formatting', () => {
  it('prices use IQD with Latin digits', () => {
    expect(formatPrice(25000)).toBe('25,000 د.ع');
  });

  it('parses database timestamps', () => {
    expect(toDate('2026-09-30 04:42:27.79+00')?.toISOString()).toBe('2026-09-30T04:42:27.790Z');
    expect(toDate('2026-09-30')).not.toBeNull();
    expect(toDate('nope')).toBeNull();
    expect(toDate(null)).toBeNull();
  });

  it('relative time in Arabic', () => {
    const now = Date.parse('2026-09-26T12:00:00Z');
    expect(formatRelative('2026-09-26T11:59:40Z', now)).toBe('الآن');
    expect(formatRelative('2026-09-26T11:55:00Z', now)).toBe('قبل 5 دقائق');
    expect(formatRelative('2026-09-26T10:00:00Z', now)).toBe('قبل ساعتين');
    expect(formatRelative('2026-09-25T11:00:00Z', now)).toBe('أمس');
  });

  it('day counts', () => {
    expect(pluralDays(1)).toBe('يوم واحد');
    expect(pluralDays(2)).toBe('يومين');
    expect(pluralDays(5)).toBe('5 أيام');
    expect(pluralDays(30)).toBe('30 يوم');
  });
});
