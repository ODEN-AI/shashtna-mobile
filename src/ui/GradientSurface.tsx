import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { gradientStyle, linear, radial, RGB } from './gradient';
import { colors, gradients, radius } from './theme';

type Props = ViewProps & {
  children?: ReactNode;
  /** Gradient stops (start → end). */
  stops?: readonly string[];
  angle?: number;
  /** Soft light spots layered on top of the gradient. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A branded gradient surface: the subscription hero, spotlight stories,
 * product visuals without an image. A light top edge gives it the "glass"
 * rim; the optional glow adds two soft light spots for depth.
 */
export function GradientSurface({ children, stops = gradients.hero, angle = 145, glow = true, style, ...props }: Props) {
  const layers = glow
    ? [radial(RGB.ice, 0.16, '10% 0%', '55%'), radial(RGB.night, 0.35, '0% 100%', '65%'), linear(angle, stops)]
    : [linear(angle, stops)];

  return (
    <View style={[styles.base, gradientStyle(...layers), style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.brandStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
  },
});
