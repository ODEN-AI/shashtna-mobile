import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/AuthProvider';
import { setPendingRedirect } from '@/src/auth/redirect';
import { openWeb } from '@/src/features/web/open';
import { API_BASE_URL, APP_VERSION } from '@/src/lib/config';
import { useHelp } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { ListRow } from '@/src/ui/ListRow';
import { Screen } from '@/src/ui/Screen';
import { SettingsGroup } from '@/src/ui/SettingsGroup';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

/**
 * «الدعم»: one calm list. The assistant, tickets, points and receipts are the
 * website's own pages inside the app; contact channels come from Admin → Settings.
 */
export default function SupportTab() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';
  const insets = useSafeAreaInsets();
  const help = useHelp();
  const support = help.data?.support;

  const member = (path: string, title: string) => {
    if (signedIn) {
      openWeb(path, title);
      return;
    }

    setPendingRedirect({ pathname: '/web', params: { path, title } });
    router.push('/login');
  };

  return (
    <Screen tabBar edges={[]} refreshing={help.isRefetching} onRefresh={() => void help.refetch()} contentStyle={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.lg, gap: space.xl }}>
      <Text variant="title" weight="bold" accessibilityRole="header">
        الدعم
      </Text>

      {!signedIn ? (
        <View style={styles.guest}>
          <Text variant="body" color={colors.ink2}>
            سجّل دخولك حتى تشوف طلباتك ونقاطك وتراسل الدعم.
          </Text>
          <Button title="تسجيل الدخول" onPress={() => router.push('/login')} />
        </View>
      ) : null}

      <SettingsGroup>
        <ListRow icon="sparkles-outline" title="اسأل مساعد شاشتنا" subtitle="يجاوبك فوراً، وإذا احتاج يحوّلك لفريق الدعم" onPress={() => member('/support/chat', 'مساعد شاشتنا')} />
        <ListRow icon="chatbubbles-outline" title="تذاكر الدعم" subtitle="افتح تذكرة وتابع الرد" onPress={() => member('/support', 'تذاكر الدعم')} />
      </SettingsGroup>

      <SettingsGroup title="حسابي">
        <ListRow icon="receipt-outline" tone="info" title="طلباتي" onPress={() => (signedIn ? router.push('/orders') : member('/orders', 'طلباتي'))} />
        <ListRow icon="star-outline" tone="warning" title="نقاط شاشتنا" onPress={() => member('/points', 'نقاط شاشتنا')} />
        <ListRow icon="document-text-outline" tone="info" title="الإيصالات" onPress={() => member('/receipts', 'الإيصالات')} />
        <ListRow icon="notifications-outline" tone="info" title="الإشعارات" onPress={() => (signedIn ? router.push('/notifications') : member('/notifications', 'الإشعارات'))} />
      </SettingsGroup>

      {support && (support.whatsapp || support.telegram || support.phone) ? (
        <SettingsGroup title="تواصل ويانا" footer={support.hours ? `أوقات الدعم: ${support.hours}` : undefined}>
          {support.whatsapp ? <ListRow icon="logo-whatsapp" tone="success" title="واتساب" onPress={() => void Linking.openURL(support.whatsapp!)} /> : null}
          {support.telegram ? <ListRow icon="paper-plane-outline" tone="info" title="تيليجرام" onPress={() => void Linking.openURL(support.telegram!)} /> : null}
          {support.phone ? <ListRow icon="call-outline" tone="neutral" title="اتصال" subtitle={support.phone} onPress={() => void Linking.openURL(`tel:${support.phone!.replace(/[^\d+]/g, '')}`)} /> : null}
        </SettingsGroup>
      ) : null}

      <SettingsGroup title="معلومات">
        <ListRow icon="help-circle-outline" tone="neutral" title="الأسئلة الشائعة وحل المشاكل" onPress={() => openWeb('/help', 'المساعدة')} />
        <ListRow icon="pulse-outline" tone="success" title="حالة الخدمة" onPress={() => router.push('/status')} />
        <ListRow icon="tv-outline" tone="brand" title="شاشتنا بلاير" subtitle="تطبيق المشاهدة للتلفزيون والموبايل" onPress={() => void Linking.openURL(`${API_BASE_URL}/apps`)} />
      </SettingsGroup>

      <Text variant="caption" color={colors.ink3} center>
        شاشتنا · الإصدار <Text variant="caption" color={colors.ink3}>{APP_VERSION}</Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guest: { gap: space.md },
});
