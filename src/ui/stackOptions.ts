import type { NativeStackNavigationOptions } from 'expo-router';

import { colors } from './theme';

/** Header and transition options shared by every stack (calm, RTL-aware, no shadow line). */
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.canvas },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerTitleAlign: 'center',
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: colors.canvas },
  animation: 'slide_from_right',
  animationDuration: 260,
};
