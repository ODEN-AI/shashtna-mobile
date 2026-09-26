import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ApiError, errorMessage } from '@/src/api/client';

import { Button } from './Button';
import { IconWell, type IconName } from './IconWell';
import { Text } from './Text';
import { colors, radius, space, type Tone } from './theme';

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  body,
  action,
  tone = 'neutral',
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: Tone;
}) {
  return (
    <View style={styles.state}>
      <IconWell name={icon} tone={tone} size={60} />
      <Text variant="heading" center>
        {title}
      </Text>
      {body ? (
        <Text color={colors.ink2} center>
          {body}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry, title }: { error: unknown; onRetry?: () => void; title?: string }) {
  const offline = error instanceof ApiError && (error.kind === 'offline' || error.kind === 'timeout');

  return (
    <EmptyState
      icon={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
      tone={offline ? 'warning' : 'danger'}
      title={title ?? (offline ? 'ماكو اتصال' : 'ما گدرنا نحمّل البيانات')}
      body={errorMessage(error)}
      action={onRetry ? <Button title="إعادة المحاولة" icon="refresh" variant="secondary" onPress={onRetry} /> : null}
    />
  );
}

/** Pulsing placeholder blocks while the first load runs. */
export function Skeleton({ height = 18, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ height, width, opacity, borderRadius: radius.sm, backgroundColor: colors.surface3 }, style]} />;
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: space.lg }} accessibilityLabel="جاري التحميل" accessibilityRole="progressbar">
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <Skeleton height={16} width="45%" />
          <Skeleton height={12} width="85%" />
          <Skeleton height={12} width="65%" />
        </View>
      ))}
    </View>
  );
}

export function Notice({ tone = 'info', icon, children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  const color = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : tone === 'success' ? colors.success : colors.info;

  return (
    <View style={[styles.notice, { borderColor: `${color}55`, backgroundColor: `${color}14` }]}>
      <Ionicons name={icon ?? (tone === 'danger' ? 'alert-circle' : tone === 'success' ? 'checkmark-circle' : 'information-circle')} size={18} color={color} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Text variant="label" color={color}>{children}</Text> : children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl * 1.5, paddingHorizontal: space.xl },
  action: { marginTop: space.sm, alignSelf: 'stretch' },
  skeletonCard: { gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  notice: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
