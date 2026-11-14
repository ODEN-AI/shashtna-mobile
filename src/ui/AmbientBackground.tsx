import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from './theme';

/**
 * The app canvas: flat night (#0B0E17), the same as the website. The colour in
 * the app comes from the subscription card, not from the background.
 */
export const AmbientBackground = memo(function AmbientBackground(_props: { variant?: 'app' | 'auth' }) {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]} />;
});
