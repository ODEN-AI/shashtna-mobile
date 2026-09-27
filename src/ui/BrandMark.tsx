import { Image } from 'expo-image';
import { View } from 'react-native';

import { shadow } from './theme';

const LOGO = require('@/assets/brand/logo.png');

/** The official Shashtna emblem (circle only). Used for brand moments, never in the tab bar. */
export function BrandMark({ size = 44, glow }: { size?: number; glow?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: glow ? shadow.glow : undefined }}>
      <Image source={LOGO} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel="شعار شاشتنا" accessible />
    </View>
  );
}
