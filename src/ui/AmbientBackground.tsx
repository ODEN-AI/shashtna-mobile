import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { gradientStyle, linear, radial, RGB } from './gradient';
import { colors, gradients } from './theme';

/**
 * The app canvas: deep navy with two restrained light pools. One static
 * layer per screen (no animation, no blur) so it costs nothing to scroll over.
 */
export const AmbientBackground = memo(function AmbientBackground({ variant = 'app' }: { variant?: 'app' | 'auth' }) {
  const layers =
    variant === 'auth'
      ? [
          radial(RGB.sky, 0.5, '100% 8%', '48%'),
          radial(RGB.electric, 0.45, '0% 92%', '52%'),
          radial(RGB.royal, 0.5, '50% 50%', '75%'),
          linear(180, ['#020A2E', colors.canvasDeep]),
        ]
      : [
          radial(RGB.electric, 0.22, '100% 0%', '55%'),
          radial(RGB.sky, 0.1, '0% 45%', '50%'),
          linear(180, gradients.canvas),
        ];

  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }, gradientStyle(...layers)]} />;
});
