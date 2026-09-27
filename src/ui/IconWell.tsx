import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { gradientStyle, linear } from './gradient';
import { colors, gradients, toneBackground, toneColor, type Tone } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * IconTile — a soft rounded container for an icon. `filled` uses the brand
 * gradient (quick actions, active states); otherwise a tinted glass tile.
 */
export function IconTile({ name, tone = 'brand', size = 44, filled }: { name: IconName; tone?: Tone; size?: number; filled?: boolean }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: filled ? colors.glassEdge : toneBackground(tone, 0.22),
          backgroundColor: filled ? colors.brand : toneBackground(tone, 0.14),
        },
        filled ? gradientStyle(linear(145, gradients.primary)) : null,
      ]}
    >
      <Ionicons name={name} size={Math.round(size * 0.48)} color={filled ? '#FFFFFF' : toneColor[tone]} />
    </View>
  );
}

/** Backwards-compatible name. */
export const IconWell = IconTile;
