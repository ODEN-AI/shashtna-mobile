import { Platform } from 'react-native';

/**
 * «بطاقة شاشتنا» — design tokens (direction contract:
 * .impeccable/surfaces/app-app-tabs-index-tsx.md).
 *
 * A quiet near-black ground with the website's brand blue; the subscription
 * is a card in the customer's hand (brand-blue face, silver band, small gold
 * seal used only on the card). One light primary button per screen. Status
 * tones come from one ramp: running blue → expiring amber → ended muted.
 * Colours match the Shashtna website (canvas #0b0e17, brand #2456e6).
 */
export const palette = {
  night: '#0B0E17',
  brand: '#2456E6',
  brandDeep: '#1A44C4',
  silver: '#C9CED8',
  gold: '#D9B46A',
  paper: '#F4F6FB',
  white: '#FFFFFF',
} as const;

export const colors = {
  // Backgrounds (tonal elevation: canvas → surface → surface2 → surface3)
  canvas: '#0B0E17',
  canvasDeep: '#080A11',
  surface: '#121622',
  surface2: '#151A26',
  surface3: '#1D2232',
  // Legacy names kept so every screen moves to the new world at once (no glass).
  glass: '#151A26',
  glassStrong: '#1D2232',
  glassBorder: '#1D2232',
  glassEdge: '#262C3D',
  // Dividers and borders
  line: '#1D2232',
  lineStrong: '#2A3142',

  // Text (contrast on canvas: ink 17.4:1, ink2 9.1:1, ink3 6.0:1)
  ink: '#F4F6FB',
  ink2: '#AAB2C5',
  ink3: '#8A92A6',
  inkOnLight: '#0B0E17',

  // Brand roles
  brand: palette.brand,
  brandStrong: palette.brandDeep,
  brandInk: '#A8C0FF',
  active: '#5B82F0',
  glow: '#7FA0FF',
  ice: palette.paper,
  silver: palette.silver,
  gold: palette.gold,

  // Status ramp and feedback
  running: palette.brand,
  expiring: '#F5B14A',
  ended: '#6B7385',
  success: '#4ADE80',
  warning: '#F5B14A',
  danger: '#F87171',
  info: '#7FA0FF',

  overlay: 'rgba(8, 10, 17, 0.72)',
} as const;

/** Gradient stops, start → end. Used sparingly: the card's sheen and the primary button only. */
export const gradients = {
  canvas: ['#0B0E17', '#0B0E17'],
  hero: [palette.brand, palette.brand],
  heroDeep: [palette.brandDeep, palette.brand],
  primary: [palette.brand, palette.brandDeep],
  active: [palette.brand, palette.brandDeep],
  ice: [palette.paper, palette.paper],
  glassSheen: ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0)'],
  warm: ['#151A26', '#1D2232'],
  success: ['#0E3B2A', '#124A34'],
  danger: ['#3D1418', '#4A1A1F'],
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

export const radius = { xs: 6, sm: 10, md: 14, lg: 16, xl: 20, xxl: 28, pill: 999 } as const;

/** One 8-pt grid (4 for fine adjustments); the page margin is 24. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;

/** Soft shadows and glows (RN 0.76+ `boxShadow`, supported on both platforms). */
export const shadow = {
  card: '0px 8px 24px rgba(0, 0, 0, 0.35)',
  float: '0px 12px 32px rgba(0, 0, 0, 0.45)',
  glow: '0px 14px 32px rgba(36, 86, 230, 0.35)',
  glowSoft: '0px 8px 20px rgba(36, 86, 230, 0.22)',
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
  size: { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, hero: 32, display: 76 },
  weight: { regular: '400', medium: '500', bold: '700', heavy: '800' } as const,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** Bottom navigation (Material): 80 dp, flush to the edge. Screens pad their scroll by this. */
export const tabBar = { height: 80, gap: 0, side: 0 } as const;

/** The Shashtna card keeps a real card's proportions (85.6 × 54 mm). */
export const CARD_RATIO = 85.6 / 54;
