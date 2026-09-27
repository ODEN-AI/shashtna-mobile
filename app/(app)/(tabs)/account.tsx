import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/src/api/auth';
import { errorMessage } from '@/src/api/client';
import type { User } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { GuestGate } from '@/src/features/GuestGate';
import { API_BASE_URL, APP_VERSION } from '@/src/lib/config';
import { usePush } from '@/src/push/PushProvider';
import { BrandMark } from '@/src/ui/BrandMark';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { gradientStyle, linear } from '@/src/ui/gradient';
import { IconTile } from '@/src/ui/IconWell';
import { ListRow } from '@/src/ui/ListRow';
import { Screen } from '@/src/ui/Screen';
import { SettingsGroup } from '@/src/ui/SettingsGroup';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, gradients, space } from '@/src/ui/theme';

const CONTACT_LABEL: Record<string, string> = { WHATSAPP: 'واتساب', TELEGRAM: 'تيليجرام', FACEBOOK: 'فيسبوك', PHONE: 'اتصال' };

function LegalGroup() {
  return (
    <SettingsGroup title="عن شاشتنا">
      <ListRow icon="document-text-outline" tone="neutral" title="الشروط والأحكام" onPress={() => void Linking.openURL(`${API_BASE_URL}/terms`)} />
      <ListRow icon="shield-outline" tone="neutral" title="سياسة الخصوصية" onPress={() => void Linking.openURL(`${API_BASE_URL}/privacy`)} />
    </SettingsGroup>
  );
}

function Version() {
  return (
    <View style={styles.version}>
      <BrandMark size={34} />
      <Text variant="caption" color={colors.ink3} center>
        شاشتنا · الإصدار {APP_VERSION}
      </Text>
    </View>
  );
}

export default function AccountScreen() {
  const { status } = useAuth();
  return status === 'signedIn' ? <MemberAccount /> : <GuestSettings />;
}

/** Guests: sign-in, help and legal — everything that works without an account. */
function GuestSettings() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen edges={[]} tabBar>
        <Text variant="title" accessibilityRole="header">
          الإعدادات
        </Text>
        <GuestGate icon="person" title="حسابك بشاشتنا" body="نفس حسابك بالموقع. سجّل دخولك حتى تطلب، تتابع اشتراكك، وتوصلك الإشعارات." />
        <SettingsGroup title="المساعدة">
          <ListRow icon="headset-outline" tone="info" title="الدعم والمساعدة" subtitle="الأسئلة الشائعة وقنوات التواصل" onPress={() => router.push('/support')} />
          <ListRow icon="pulse-outline" tone="success" title="حالة الخدمة" onPress={() => router.push('/status')} />
        </SettingsGroup>
        <LegalGroup />
        <Version />
      </Screen>
    </SafeAreaView>
  );
}

function MemberAccount() {
  const { user, signOut, updateUser } = useAuth();
  const push = usePush();
  const toast = useToast();

  // Preferences are stored on the account (same toggles as the website).
  const save = useMutation({
    mutationFn: (input: Partial<User>) => authApi.updateMe(input),
    onSuccess: (result) => updateUser(result.user),
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen edges={[]} tabBar>
        <Text variant="title" accessibilityRole="header">
          حسابي
        </Text>

        <Card style={styles.profile} onPress={() => router.push('/account/profile')} accessibilityLabel={`بياناتي، ${user.name}`} glow>
          <View style={styles.avatar}>
            <Text variant="title" color="#FFFFFF">
              {user.name.trim().charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading" numberOfLines={1}>
              {user.name}
            </Text>
            <Text variant="caption" color={colors.ink3} style={{ writingDirection: 'ltr' }}>
              {user.phone}
            </Text>
          </View>
          <IconTile name="create-outline" size={40} />
        </Card>

        <SettingsGroup title="اشتراكي وطلباتي">
          <ListRow icon="tv-outline" title="اشتراكاتي" onPress={() => router.push('/subscriptions')} />
          <ListRow icon="receipt-outline" title="طلباتي" onPress={() => router.push('/orders')} />
          <ListRow icon="headset-outline" tone="info" title="الدعم والمساعدة" onPress={() => router.push('/support')} />
          <ListRow icon="pulse-outline" tone="success" title="حالة الخدمة" onPress={() => router.push('/status')} />
        </SettingsGroup>

        <SettingsGroup title="الإشعارات">
          <ListRow
            icon={push.permission === 'granted' ? 'notifications' : 'notifications-off-outline'}
            tone={push.permission === 'granted' ? 'success' : 'warning'}
            title={push.permission === 'granted' ? 'إشعارات الهاتف مفعّلة' : push.permission === 'unavailable' ? 'الإشعارات غير متاحة على هذا الجهاز' : 'إشعارات الهاتف مطفية'}
            subtitle="الطلبات والدفع والتفعيل وردود الدعم"
            trailing={push.permission === 'granted' || push.permission === 'unavailable' ? null : <Button title="تفعيل" compact onPress={() => void push.enable()} />}
          />
          <ListRow icon="pulse-outline" tone="info" title="فحص الإشعارات" subtitle="تأكد إن هاتفك يستلم إشعارات شاشتنا" onPress={() => router.push('/account/notifications-check')} />
          <Toggle icon="time-outline" title="تذكير قبل انتهاء الاشتراك" value={user.renewalReminders} busy={save.isPending} onChange={(value) => save.mutate({ renewalReminders: value })} />
          <Toggle icon="pricetag-outline" title="العروض والخصومات" value={user.marketingOptIn} busy={save.isPending} onChange={(value) => save.mutate({ marketingOptIn: value })} />
        </SettingsGroup>

        <SettingsGroup title="الحساب والأمان">
          <ListRow
            icon="chatbubble-ellipses-outline"
            title="طريقة التواصل المفضلة"
            subtitle={user.preferredContact ? CONTACT_LABEL[user.preferredContact] : 'غير محددة'}
            onPress={() => router.push('/account/profile')}
          />
          <ListRow icon="key-outline" title="تغيير كلمة المرور" onPress={() => router.push('/account/password')} />
          <ListRow
            icon="phone-portrait-outline"
            tone="warning"
            title="تسجيل الخروج من كل الأجهزة"
            subtitle="إذا ضاع هاتفك أو دخلت من جهاز مو إلك"
            onPress={() =>
              Alert.alert('تسجيل الخروج من كل الأجهزة؟', 'راح ينطفي دخولك بالموقع وبكل الهواتف، وتوقف الإشعارات عليها.', [
                { text: 'رجوع', style: 'cancel' },
                {
                  text: 'خروج من الكل',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await authApi.logoutAll();
                    } catch (error) {
                      toast(errorMessage(error), 'error');
                      return;
                    }
                    void signOut('تم تسجيل الخروج من كل الأجهزة.');
                  },
                },
              ])
            }
          />
        </SettingsGroup>

        <LegalGroup />

        <Button
          title="تسجيل الخروج"
          icon="log-out-outline"
          variant="danger"
          testID="sign-out"
          onPress={() =>
            Alert.alert('تسجيل الخروج؟', 'راح توقف إشعارات هذا الحساب على هذا الهاتف.', [
              { text: 'رجوع', style: 'cancel' },
              { text: 'خروج', style: 'destructive', onPress: () => void signOut() },
            ])
          }
        />
        <Version />
      </Screen>
    </SafeAreaView>
  );
}

function Toggle({ icon, title, value, onChange, busy }: { icon: Parameters<typeof IconTile>[0]['name']; title: string; value: boolean; onChange: (value: boolean) => void; busy?: boolean }) {
  return (
    <View style={styles.toggle}>
      <IconTile name={icon} size={40} />
      <Text variant="label" style={{ flex: 1 }}>
        {title}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={busy}
        trackColor={{ true: colors.brand, false: colors.surface3 }}
        thumbColor={colors.ink}
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.glassEdge,
    ...gradientStyle(linear(145, gradients.primary)),
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60 },
  version: { alignItems: 'center', gap: space.sm, paddingTop: space.sm },
});
