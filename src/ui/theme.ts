import { Platform } from 'react-native';

/**
 * Shashtna Liquid Glass — design tokens.
 *
 * Built on the brand blue family:
 *   #03195B navy · #0B2CB1 royal · #1951FC electric · #3781FC sky · #CBE9FD ice
 *
 * Depth comes from a deep navy canvas, translucent "glass" layers with a light
 * top edge, and blue gradients reserved for the few things that deserve
 * attention (the subscription hero, primary actions, the active tab, the
 * spotlight). Glass is a translucent fill, not a live blur: real-time blur is
 * expensive on mid-range Android phones and is not needed on a dark canvas.
 */
export const palette = {
  navy: '#03195B',
  royal: '#0B2CB1',
  electric: '#1951FC',
  sky: '#3781FC',
  ice: '#CBE9FD',
  white: '#FFFFFF',
} as const;

export const colors = {
  // Backgrounds
  canvas: '#020B26',
  canvasDeep: '#010619',
  surface: '#061A4A',
  surface2: '#0A2159',
  surface3: '#10296A',
  // Glass layers (on the canvas or on gradients)
  glass: 'rgba(203, 233, 253, 0.06)',
  glassStrong: 'rgba(203, 233, 253, 0.10)',
  glassBorder: 'rgba(203, 233, 253, 0.14)',
  glassEdge: 'rgba(203, 233, 253, 0.26)',
  // Dividers and borders
  line: 'rgba(203, 233, 253, 0.09)',
  lineStrong: 'rgba(203, 233, 253, 0.18)',

  // Text (contrast measured on `canvas`: ink 17:1, ink2 10:1, ink3 5.6:1)
  ink: '#F3F8FF',
  ink2: '#B7C8EC',
  ink3: '#8398C6',
  inkOnLight: '#03195B',

  // Brand roles
  brand: palette.electric,
  brandStrong: palette.royal,
  brandInk: '#8CC2FF',
  active: palette.sky,
  glow: '#6CC4FF',
  ice: palette.ice,

  // Feedback
  success: '#3DDC97',
  warning: '#FFC247',
  danger: '#FF7A7A',
  info: '#7CC4FF',

  overlay: 'rgba(1, 6, 25, 0.72)',
} as const;

/** Gradient stops, always listed start → end. */
export const gradients = {
  canvas: ['#041342', '#020B26', '#010619'],
  // Every stop that carries text keeps white ≥ 5.7:1 and ice ≥ 4.5:1.
  hero: [palette.royal, '#1542D8', palette.electric],
  heroDeep: ['#051E6E', palette.royal, '#1542D8'],
  primary: [palette.electric, '#1542D8'],
  active: [palette.electric, '#1542D8'],
  ice: ['#E8F5FE', palette.ice],
  glassSheen: ['rgba(203, 233, 253, 0.13)', 'rgba(203, 233, 253, 0.03)'],
  warm: ['#1B2C7A', '#3A2E8C'],
  success: ['#0B5E4A', '#0E7A5E'],
  danger: ['#5E1030', '#7A1A3A'],
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

function rgba(hex: string, alpha: number) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/** Translucent background for a tone (badges, icon tiles). */
export function toneBackground(tone: Tone, alpha = 0.14) {
  return rgba(tone === 'neutral' ? colors.ink3 : toneColor[tone], alpha);
}

export { rgba };

export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, xxl: 36, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

/** Soft shadows and glows (RN 0.76+ `boxShadow`, supported on both platforms). */
export const shadow = {
  card: '0px 10px 28px rgba(1, 6, 25, 0.45)',
  float: '0px 16px 40px rgba(1, 6, 25, 0.6)',
  glow: '0px 12px 36px rgba(25, 81, 252, 0.45)',
  glowSoft: '0px 8px 24px rgba(55, 129, 252, 0.28)',
} as const;

/** Motion: short, eased, and skipped entirely when the OS asks for reduced motion. */
export const motion = {
  fast: 160,
  base: 240,
  slow: 420,
  story: 6000,
  spring: { damping: 18, stiffness: 180, mass: 0.9 },
} as const;

/**
 * System fonts render Arabic well on both platforms (Noto Sans Arabic on
 * Android, SF Arabic on iOS). The website's Thmanyah Sans is not bundled: its
 * licence does not allow redistributing the font files inside an app.
 */
export const font = {
  family: Platform.select({ ios: 'System', default: undefined }),
  size: { xs: 12, sm: 13.5, md: 15, lg: 17, xl: 20, xxl: 26, hero: 34, display: 42 },
  weight: { regular: '400', medium: '500', bold: '700', heavy: '800' } as const,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** Floating tab bar geometry, shared by the bar and by screens that scroll under it. */
export const tabBar = { height: 66, gap: 12, side: 16 } as const;
