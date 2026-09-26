import { Platform } from 'react-native';

/**
 * Shashtna design tokens — the same palette as the website (deep navy,
 * controlled blue/cyan accent, restrained glow), tuned for touch.
 */
export const colors = {
  canvas: '#050A14',
  surface: '#0A1222',
  surface2: '#0F192D',
  surface3: '#16223A',
  line: '#1B2740',
  lineStrong: '#27365A',

  ink: '#EEF2FB',
  ink2: '#AEB8CF',
  ink3: '#74809B',

  brand: '#2F6BFF',
  brandStrong: '#1F56E6',
  brandInk: '#8FB0FF',
  glow: '#22D3EE',

  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',

  overlay: 'rgba(5, 10, 20, 0.72)',
} as const;

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'glow';

export const toneColor: Record<Tone, string> = {
  neutral: colors.ink2,
  brand: colors.brandInk,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  glow: colors.glow,
};

/** Translucent background for a tone (badges, icon wells). */
export function toneBackground(tone: Tone, alpha = 0.14) {
  const hex = tone === 'neutral' ? colors.ink3 : toneColor[tone];
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/**
 * System fonts render Arabic well on both platforms (Noto Sans Arabic on
 * Android, SF Arabic on iOS). The website's Thmanyah Sans is not bundled: its
 * licence does not allow redistributing the font files inside an app.
 */
export const font = {
  family: Platform.select({ ios: 'System', default: undefined }),
  size: { xs: 12, sm: 13.5, md: 15, lg: 17, xl: 20, xxl: 26, hero: 32 },
  weight: { regular: '400', medium: '500', bold: '700', heavy: '800' } as const,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
