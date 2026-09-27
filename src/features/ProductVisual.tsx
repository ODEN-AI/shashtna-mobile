import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAmbientMotion } from '@/src/hooks/useReducedMotion';
import { gradientStyle, linear, radial, RGB } from '@/src/ui/gradient';
import { colors, gradients, shadow } from '@/src/ui/theme';

type Kind = 'offer' | 'package' | 'device';

function glyph(kind: Kind, serviceType: string | null) {
  if (kind === 'device') return 'hardware-chip' as const;
  if (kind === 'offer') return 'pricetag' as const;
  return serviceType === 'VIP' ? ('diamond' as const) : ('tv' as const);
}

/**
 * The product's picture — the admin's image when there is one, otherwise a
 * branded gradient emblem (never a stock photo). `floating` adds a slow,
 * subtle drift (off under reduced motion).
 */
export function ProductVisual({
  imageUrl,
  kind,
  serviceType,
  size = 112,
  floating,
  style,
}: {
  imageUrl: string | null;
  kind: Kind;
  serviceType: string | null;
  size?: number;
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const active = useAmbientMotion();
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!floating || !active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floating, active, drift]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <Animated.View style={[{ width: size, height: size, transform: [{ translateY }] }, style]}>
      {imageUrl ? (
        <Image
          source={imageUrl}
          style={[styles.image, { borderRadius: size * 0.22 }]}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.emblem, { borderRadius: size * 0.3 }]}>
          <View style={[styles.ring, { width: size * 0.74, height: size * 0.74, borderRadius: size * 0.37 }]} />
          <Ionicons name={glyph(kind, serviceType)} size={size * 0.4} color="#FFFFFF" />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.glassEdge },
  emblem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassEdge,
    backgroundColor: colors.brand,
    boxShadow: shadow.glowSoft,
    ...gradientStyle(radial(RGB.ice, 0.4, '28% 18%', '55%'), linear(150, gradients.hero)),
  },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(203, 233, 253, 0.35)' },
});

