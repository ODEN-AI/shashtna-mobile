/**
 * Shashtna design tokens, from the Google Stitch design
 * ("SHASHTNA Premium Entertainment & VIP 2 Platform", DESIGN.md in the Stitch
 * export, 2026-11-15). Deep navy surfaces, royal cobalt for the main actions,
 * warm amber for renewal and "ending soon", champagne gold for VIP, emerald
 * for "active". Glass is drawn with translucent fills, never live blur, so it
 * stays smooth on low-cost Android phones.
 */
export const palette = {
  navy: '#0D1323',
  navyDeep: '#080E1E',
  cobalt: '#2563EB',
  cobaltDeep: '#1E40AF',
  periwinkle: '#B4C5FF',
  sky: '#7BD0FF',
  amber: '#FFB95F',
  amberDeep: '#EE9800',
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  emerald: '#10B981',
  crimson: '#EF4444',
  white: '#FFFFFF',
} as const;

export const colors = {
  // Surfaces (Material 3 tonal steps from the Stitch theme)
  canvas: '#0D1323', // surface / background
  canvasDeep: '#080E1E', // surface-container-lowest (bars, insets)
  surfaceLow: '#151B2C', // surface-container-low
  surface: '#191F30', // surface-container (cards)
  surface2: '#24293B', // surface-container-high (raised, chips)
  surface3: '#2F3446', // surface-container-highest (tracks, pills)
  // Legacy names kept so older screens follow the new theme.
  glass: '#191F30',
  glassStrong: '#24293B',
  glassBorder: '#24293B',
  glassEdge: '#2F3446',
  line: '#24293B',
  lineStrong: '#434655', // outline-variant

  // Text
  ink: '#DDE2F9', // on-surface
  ink2: '#C3C6D7', // on-surface-variant
  ink3: '#8D90A0', // outline
  inkOnLight: '#0D1323',

  // Brand roles
  brand: palette.cobalt, // primary-container: filled primary buttons
  brandStrong: palette.cobaltDeep,
  brandInk: palette.periwinkle, // primary: links, active icons, text on dark
  onBrand: '#EEEFFF',
  active: palette.periwinkle,
  glow: palette.sky,
  sky: palette.sky,
  ice: '#EEEFFF',

  // Renewal / attention (secondary)
  amber: palette.amber,
  amberDeep: palette.amberDeep,
  onAmber: '#472A00',
  // VIP prestige
  gold: palette.gold,
  goldLight: palette.goldLight,
  silver: '#C3C6D7',

  // Status
  running: palette.emerald,
  expiring: palette.amber,
  ended: palette.crimson,
  success: palette.emerald,
  warning: palette.amber,
  danger: '#FFB4AB',
  dangerStrong: palette.crimson,
  info: palette.sky,

  overlay: 'rgba(8, 14, 30, 0.78)',
} as const;

/** Gradient stops, start → end (rendered with experimental_backgroundImage). */
export const gradients = {
  canvas: [colors.canvas, colors.canvas],
  hero: [colors.surface2, colors.surface],
  heroDeep: [palette.cobaltDeep, palette.cobalt],
  primary: [palette.cobalt, palette.cobaltDeep],
  active: [palette.cobalt, palette.cobaltDeep],
  ice: ['#EEEFFF', '#EEEFFF'],
  glassSheen: ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0)'],
  warm: [colors.surface, colors.surface2, colors.surface],
  dial: [palette.sky, palette.cobalt],
  vip: ['#1A1C23', '#121316'],
  success: ['#0E3B2A', '#124A34'],
  danger: ['#3D1418', '#4A1A1F'],
} as const;

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'glow' | 'vip';

export const toneColor: Record<Tone, string> = {
  neutral: colors.ink2,
  brand: colors.brandInk,
  success: colors.success,
  warning: colors.amber,
  danger: colors.danger,
  info: colors.sky,
  glow: colors.sky,
  vip: colors.gold,
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

/** Stitch export: chips and inputs 8 (rounded-lg), cards 12 (rounded-xl), sheets 24, actions pill. */
export const radius = { xs: 4, sm: 8, md: 12, lg: 12, xl: 12, xxl: 24, pill: 999 } as const;

/** Stitch spacing: margin 16, gutter 16 (12 small), steps 4/8/16/24/32. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;

export const shadow = {
  card: '0px 8px 24px rgba(0, 0, 0, 0.45)',
  float: '0px 20px 40px rgba(0, 0, 0, 0.7)',
  glow: '0px 0px 20px rgba(37, 99, 235, 0.35)',
  glowSoft: '0px 8px 20px rgba(37, 99, 235, 0.22)',
  amber: '0px 8px 20px rgba(255, 185, 95, 0.2)',
  gold: '0px 12px 32px rgba(245, 158, 11, 0.12)',
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
 * IBM Plex Sans Arabic (SIL Open Font License, bundled through
 * @expo-google-fonts). Android needs one family per weight, so `Text` picks
 * the family from the weight.
 */
export const fontFamily = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export const font = {
  family: fontFamily.regular,
  /** Stitch scale: body-sm 12, body-md 14, title-md 16, title-lg 18, headline-md 20, headline-lg-mobile 22, headline-xl-mobile 28. */
  size: { xs: 12, sm: 14, md: 14, lg: 18, xl: 20, xxl: 22, hero: 28, display: 36 },
  weight: { regular: '400', medium: '500', bold: '700', heavy: '700', semibold: '600' } as const,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** Bottom navigation: 72 dp bar with a raised centre action. Screens pad their scroll by this. */
export const tabBar = { height: 72, gap: 0, side: 0 } as const;

/** Kept for the subscription card component. */
export const CARD_RATIO = 85.6 / 54;
