import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ApiError, errorMessage } from '@/src/api/client';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

import { Button } from './Button';
import { IconTile, type IconName } from './IconWell';
import { Text } from './Text';
import { colors, radius, space, toneBackground, toneColor, type Tone } from './theme';

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
      <View style={[styles.halo, { backgroundColor: toneBackground(tone, 0.08) }]}>
        <IconTile name={icon} tone={tone} size={64} />
      </View>
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
      action={onRetry ? <Button title="إعادة المحاولة" icon="refresh" variant="glass" onPress={onRetry} /> : null}
    />
  );
}

/** Placeholder block while the first load runs (a gentle pulse; static under reduced motion). */
export function Skeleton({ height = 18, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);

  return <Animated.View style={[{ height, width, opacity, borderRadius: radius.sm, backgroundColor: colors.glassStrong }, style]} />;
}

export function LoadingState({ rows = 3, variant = 'cards' }: { rows?: number; variant?: 'cards' | 'hero' }) {
  return (
    <View style={{ gap: space.lg }} accessibilityLabel="جاري التحميل" accessibilityRole="progressbar">
      {variant === 'hero' ? (
        <View style={[styles.skeletonCard, { minHeight: 190, borderRadius: radius.xl }]}>
          <Skeleton height={14} width="30%" />
          <Skeleton height={26} width="60%" />
          <Skeleton height={44} width="35%" />
          <Skeleton height={8} />
        </View>
      ) : null}
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
  const color = tone === 'neutral' ? colors.ink2 : toneColor[tone];

  return (
    <View style={[styles.notice, { borderColor: toneBackground(tone, 0.35), backgroundColor: toneBackground(tone, 0.1) }]} accessibilityRole="alert">
      <Ionicons name={icon ?? (tone === 'danger' ? 'alert-circle' : tone === 'success' ? 'checkmark-circle' : 'information-circle')} size={20} color={color} />
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <Text variant="label" color={color}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: space.md, paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  halo: { padding: space.lg, borderRadius: radius.xxl, marginBottom: space.xs },
  action: { marginTop: space.sm, alignSelf: 'stretch' },
  skeletonCard: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(10, 33, 89, 0.45)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  notice: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
