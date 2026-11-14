import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useQueryClient } from '@tanstack/react-query';

import { webSessionApi } from '@/src/api/web';
import { useAuth } from '@/src/auth/AuthProvider';
import { API_BASE_URL } from '@/src/lib/config';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, space } from '@/src/ui/theme';

const SITE = new URL(API_BASE_URL);

/** Only the Shashtna website opens inside the app; everything else (WhatsApp, Telegram…) opens outside. */
function isSiteUrl(url: string) {
  try {
    const target = new URL(url);

    return target.host === SITE.host;
  } catch {
    return url.startsWith('about:') || url.startsWith('data:');
  }
}

type Source = { uri: string; method: 'POST'; body: string; headers: Record<string, string> };

/**
 * A page of the Shashtna website inside the app (store, checkout, points,
 * chat, tickets). Signed-in customers arrive signed in through a one-time
 * code POSTed to /app/handoff; guests arrive as guests. Either way the
 * website renders in its app mode (no site header, footer or menus).
 */
export function WebPage({ path, title, bar = true }: { path: string; title?: string; bar?: boolean }) {
  const { status } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const web = useRef<WebView>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // A fresh handoff for each open (codes live 60 seconds).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let code = '';

      if (status === 'signedIn') {
        try {
          code = (await webSessionApi.create()).code;
        } catch {
          // Fall back to a guest view: the page offers sign-in itself.
        }
      }

      if (!cancelled) {
        setSource({
          uri: `${API_BASE_URL}/app/handoff`,
          method: 'POST',
          body: `code=${encodeURIComponent(code)}&next=${encodeURIComponent(path)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, status, attempt]);

  // Android Back walks the website's history first.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack) {
          web.current?.goBack();
          return true;
        }

        return false;
      });

      return () => sub.remove();
    }, [canGoBack]),
  );

  // Orders, points and subscriptions may have changed on the website.
  useFocusEffect(
    useCallback(
      () => () => {
        void queryClient.invalidateQueries();
      },
      [queryClient],
    ),
  );

  const onNavigation = (event: WebViewNavigation) => setCanGoBack(event.canGoBack);

  const onShouldStart = useCallback((request: { url: string }) => {
    if (isSiteUrl(request.url)) return true;

    void Linking.openURL(request.url).catch(() => undefined);

    return false;
  }, []);

  const header = useMemo(
    () =>
      bar ? (
        <View style={[styles.bar, { paddingTop: insets.top + space.sm }]}>
          <Pressable
            onPress={() => (canGoBack ? web.current?.goBack() : router.back())}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            style={styles.icon}
          >
            <Ionicons name="arrow-forward" size={22} color={colors.ink} />
          </Pressable>
          <Text variant="heading" numberOfLines={1} style={styles.title}>
            {title ?? ''}
          </Text>
          <Pressable onPress={() => web.current?.reload()} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="تحديث" style={styles.icon}>
            <Ionicons name="refresh" size={20} color={colors.ink2} />
          </Pressable>
        </View>
      ) : (
        <View style={{ height: insets.top, backgroundColor: colors.canvas }} />
      ),
    [bar, canGoBack, insets.top, router, title],
  );

  return (
    <View style={styles.screen}>
      {header}

      {failed ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.ink3} />
          <Text variant="heading" center style={styles.gap}>
            ما كدرنا نفتح الصفحة
          </Text>
          <Text variant="body" color={colors.ink2} center>
            تأكد من النت وجرّب مرة ثانية.
          </Text>
          <View style={styles.gap}>
            <Button title="حاول مرة ثانية" onPress={() => {
                setFailed(false);
                setSource(null);
                setAttempt((value) => value + 1);
              }} />
          </View>
        </View>
      ) : source ? (
        <WebView
          ref={web}
          source={source}
          style={styles.web}
          containerStyle={styles.web}
          originWhitelist={['https://*', 'http://*']}
          onShouldStartLoadWithRequest={onShouldStart}
          onNavigationStateChange={onNavigation}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setFailed(true)}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) setFailed(true);
          }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          overScrollMode="never"
          forceDarkOn={false}
          testID="web-page"
        />
      ) : null}

      {loading && !failed ? (
        <View pointerEvents="none" style={[styles.loading, { top: bar ? insets.top + 64 : insets.top + space.lg }]}>
          <ActivityIndicator color={colors.brandInk} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    backgroundColor: colors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
  web: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  gap: { marginTop: space.lg },
  loading: { position: 'absolute', start: 0, end: 0, alignItems: 'center' },
});
