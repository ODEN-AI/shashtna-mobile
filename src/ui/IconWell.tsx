import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { colors, toneBackground, toneColor, type Tone } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * IconTile (Stitch icon tile): a rounded square tinted with the tone; `filled`
 * is solid cobalt with a soft glow.
 */
export function IconTile({ name, tone = 'brand', size = 44, filled }: { name: IconName; tone?: Tone; size?: number; filled?: boolean }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? colors.brand : toneBackground(tone, 0.14),
        },
        filled ? { boxShadow: '0px 0px 20px rgba(37, 99, 235, 0.35)' } : null,
      ]}
    >
      <Ionicons name={name} size={Math.round(size * 0.48)} color={filled ? '#FFFFFF' : toneColor[tone]} />
    </View>
  );
}

/** Backwards-compatible name. */
export const IconWell = IconTile;
