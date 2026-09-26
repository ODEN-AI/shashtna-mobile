/**
 * Formatting for Arabic UI with Latin digits (how Shashtna writes prices and
 * dates on the website).
 */

const LOCALE = 'ar-IQ-u-nu-latn';

export function formatPrice(value: number) {
  return `${new Intl.NumberFormat('en-US').format(value)} د.ع`;
}

/** Database timestamps look like "2026-09-30 04:42:27.79+00". */
export function toDate(value: string | null | undefined) {
  if (!value) return null;
  let text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    text = `${text}T00:00:00`;
  } else {
    text = text.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(LOCALE, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** "قبل 5 دقائق", "أمس", or a date for anything older than a week. */
export function formatRelative(value: string | null | undefined, now = Date.now()) {
  const date = toDate(value);
  if (!date) return '—';

  const seconds = Math.round((now - date.getTime()) / 1000);

  if (seconds < 60) return 'الآن';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? 'قبل دقيقة' : minutes === 2 ? 'قبل دقيقتين' : `قبل ${minutes} ${minutes <= 10 ? 'دقائق' : 'دقيقة'}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'قبل ساعة' : hours === 2 ? 'قبل ساعتين' : `قبل ${hours} ${hours <= 10 ? 'ساعات' : 'ساعة'}`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return days === 2 ? 'قبل يومين' : `قبل ${days} أيام`;

  return formatDate(value);
}

export function pluralDays(days: number) {
  if (days === 0) return 'اليوم';
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومين';
  if (days <= 10) return `${days} أيام`;
  return `${days} يوم`;
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'هلا بيك';
  return 'مساء الخير';
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
