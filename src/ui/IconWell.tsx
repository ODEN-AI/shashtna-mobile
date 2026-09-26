import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { toneBackground, toneColor, type Tone } from './theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function IconWell({ name, tone = 'brand', size = 44 }: { name: IconName; tone?: Tone; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: toneBackground(tone, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={toneColor[tone]} />
    </View>
  );
}
