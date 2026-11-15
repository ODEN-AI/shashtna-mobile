import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, font, fontFamily } from './theme';

type Variant = 'display' | 'hero' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'micro' | 'mono';

/** The Stitch type scale (IBM Plex Sans Arabic). Arabic needs the generous line heights. */
const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: 36, fontWeight: '700', lineHeight: 44 }, // headline-xl
  hero: { fontSize: 28, fontWeight: '700', lineHeight: 36 }, // headline-xl-mobile
  title: { fontSize: 22, fontWeight: '700', lineHeight: 30 }, // headline-lg-mobile (the comps set it bold)
  heading: { fontSize: 18, fontWeight: '600', lineHeight: 26 }, // title-lg
  body: { fontSize: 14, fontWeight: '400', lineHeight: 22 }, // body-md
  label: { fontSize: 14, fontWeight: '600', lineHeight: 20 }, // label-lg
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 18 }, // body-sm
  micro: { fontSize: 10, fontWeight: '700', lineHeight: 14 }, // label-sm
  mono: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5, writingDirection: 'ltr' },
};

function familyFor(weight: TextStyle['fontWeight']) {
  const value = Number(weight ?? 400);
  if (value >= 700 || weight === 'bold') return fontFamily.bold;
  if (value >= 600) return fontFamily.semibold;
  if (value >= 500) return fontFamily.medium;
  return fontFamily.regular;
}

export function Text({
  variant = 'body',
  color = colors.ink,
  weight,
  center,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string; weight?: keyof typeof font.weight; center?: boolean }) {
  const flat = StyleSheet.flatten([VARIANTS[variant], weight ? { fontWeight: font.weight[weight] } : null, style]) ?? {};
  // Android picks a bundled weight by family name; a synthesized fontWeight on top would double-bold it.
  const family = flat.fontFamily && !flat.fontFamily.startsWith('IBMPlexSansArabic') ? flat.fontFamily : familyFor(flat.fontWeight);

  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[{ color, textAlign: center ? 'center' : 'left' }, flat, { fontFamily: family, fontWeight: undefined }]}
      {...props}
    />
  );
}
