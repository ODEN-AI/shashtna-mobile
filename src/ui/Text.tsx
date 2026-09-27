import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, font } from './theme';

type Variant = 'display' | 'hero' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: font.size.display, fontWeight: font.weight.heavy, lineHeight: 52 },
  hero: { fontSize: font.size.hero, fontWeight: font.weight.heavy, lineHeight: 44 },
  title: { fontSize: font.size.xxl, fontWeight: font.weight.heavy, lineHeight: 36 },
  heading: { fontSize: font.size.lg, fontWeight: font.weight.bold, lineHeight: 26 },
  body: { fontSize: font.size.md, fontWeight: font.weight.regular, lineHeight: 24 },
  label: { fontSize: font.size.sm, fontWeight: font.weight.bold, lineHeight: 20 },
  caption: { fontSize: font.size.xs, fontWeight: font.weight.medium, lineHeight: 18 },
  mono: { fontSize: font.size.lg, fontWeight: font.weight.bold, letterSpacing: 0.5, writingDirection: 'ltr' },
};

export function Text({
  variant = 'body',
  color = colors.ink,
  weight,
  center,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string; weight?: keyof typeof font.weight; center?: boolean }) {
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[
        { fontFamily: font.family, color, textAlign: center ? 'center' : 'left' },
        VARIANTS[variant],
        weight ? { fontWeight: font.weight[weight] } : null,
        style,
      ]}
      {...props}
    />
  );
}
