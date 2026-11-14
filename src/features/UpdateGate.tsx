import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { configApi } from '@/src/api/web';
import { APP_VERSION } from '@/src/lib/config';
import { updateState } from '@/src/lib/version';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, space } from '@/src/ui/theme';

/**
 * The APK never updates itself: Admin → Settings → «تطبيق شاشتنا للموبايل»
 * sets the latest and minimum versions. Below the minimum the app asks for the
 * update before anything else; below the latest a quiet banner suggests it.
 * A failed check never blocks the app.
 */
export function UpdateGate({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  const config = useQuery({ queryKey: ['app-config'], queryFn: configApi.get, staleTime: 30 * 60_000, retry: 1 });
  const app = config.data?.customerApp;
  const state = updateState(APP_VERSION, app?.latestVersion, app?.minVersion);
  const url = app?.downloadUrl;
  const open = () => (url ? void Linking.openURL(url).catch(() => undefined) : undefined);

  if (state === 'required') {
    return (
      <View style={[styles.full, { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.xl }]} testID="update-required">
        <View style={{ flex: 1, justifyContent: 'center', gap: space.md }}>
          <Ionicons name="arrow-down-circle-outline" size={48} color={colors.brandInk} />
          <Text variant="title">نزّل النسخة الجديدة</Text>
          <Text variant="body" color={colors.ink2}>
            هاي النسخة من التطبيق قديمة وما تشتغل بعد. نزّل الجديدة وثبّتها فوق القديمة، وحسابك يبقى مثل ما هو.
          </Text>
        </View>
        {url ? <Button title="تنزيل التحديث" size="lg" variant="light" icon="download-outline" onPress={open} /> : (
          <Text variant="body" color={colors.ink2}>
            تواصل ويانا حتى نرسلك رابط التحديث.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {state === 'suggested' && url && !dismissed ? (
        <View style={[styles.banner, { top: insets.top + space.sm }]} testID="update-suggested">
          <Pressable onPress={open} accessibilityRole="button" style={{ flex: 1 }}>
            <Text variant="label">نسخة جديدة من التطبيق</Text>
            <Text variant="caption" color={colors.ink2}>
              اضغط حتى تنزّلها
            </Text>
          </Pressable>
          <Pressable onPress={() => setDismissed(true)} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="إغلاق" style={styles.close}>
            <Ionicons name="close" size={20} color={colors.ink2} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: space.xl, gap: space.xl },
  banner: {
    position: 'absolute',
    start: space.lg,
    end: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    paddingStart: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
