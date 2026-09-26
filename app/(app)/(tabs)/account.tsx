import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/src/api/auth';
import { errorMessage } from '@/src/api/client';
import type { User } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { API_BASE_URL, APP_VERSION } from '@/src/lib/config';
import { usePush } from '@/src/push/PushProvider';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { ListRow } from '@/src/ui/ListRow';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, space } from '@/src/ui/theme';

const CONTACT_LABEL: Record<string, string> = { WHATSAPP: 'واتساب', TELEGRAM: 'تيليجرام', FACEBOOK: 'فيسبوك', PHONE: 'اتصال' };

export default function AccountScreen() {
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
      <Screen edges={[]}>
        <Text variant="title">حسابي</Text>

        <Card style={styles.profile} onPress={() => router.push('/account/profile')} accessibilityLabel="بياناتي">
          <View style={styles.avatar}>
            <Text variant="title" color={colors.canvas}>
              {user.name.trim().charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{user.name}</Text>
            <Text variant="caption" color={colors.ink3} style={{ writingDirection: 'ltr' }}>
              {user.phone}
            </Text>
          </View>
        </Card>

        <Section title="اشتراكي وطلباتي">
          <Card style={{ paddingVertical: 0 }}>
            <ListRow icon="tv-outline" title="اشتراكاتي" onPress={() => router.push('/subscriptions')} />
            <ListRow icon="receipt-outline" title="طلباتي" onPress={() => router.push('/orders')} />
            <ListRow icon="headset-outline" tone="info" title="الدعم والمساعدة" onPress={() => router.push('/support')} />
            <ListRow icon="pulse-outline" tone="success" title="حالة الخدمة" onPress={() => router.push('/status')} />
          </Card>
        </Section>

        <Section title="الإشعارات">
          <Card style={{ gap: space.md }}>
            <ListRow
              icon={push.permission === 'granted' ? 'notifications' : 'notifications-off-outline'}
              tone={push.permission === 'granted' ? 'success' : 'warning'}
              title={push.permission === 'granted' ? 'إشعارات الهاتف مفعّلة' : push.permission === 'unavailable' ? 'الإشعارات غير متاحة على هذا الجهاز' : 'إشعارات الهاتف مطفية'}
              subtitle="الطلبات والدفع والتفعيل وردود الدعم"
              trailing={
                push.permission === 'granted' || push.permission === 'unavailable' ? null : (
                  <Button title="تفعيل" compact onPress={() => void push.enable()} />
                )
              }
            />
            <ListRow icon="pulse-outline" tone="info" title="فحص الإشعارات" subtitle="تأكد إن هاتفك يستلم إشعارات شاشتنا" onPress={() => router.push('/account/notifications-check')} />
            <Toggle
              title="تذكير قبل انتهاء الاشتراك"
              value={user.renewalReminders}
              busy={save.isPending}
              onChange={(value) => save.mutate({ renewalReminders: value })}
            />
            <Toggle title="العروض والخصومات" value={user.marketingOptIn} busy={save.isPending} onChange={(value) => save.mutate({ marketingOptIn: value })} />
          </Card>
        </Section>

        <Section title="الحساب">
          <Card style={{ paddingVertical: 0 }}>
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
            <ListRow icon="document-text-outline" tone="neutral" title="الشروط والأحكام" onPress={() => void Linking.openURL(`${API_BASE_URL}/terms`)} />
            <ListRow icon="shield-outline" tone="neutral" title="سياسة الخصوصية" onPress={() => void Linking.openURL(`${API_BASE_URL}/privacy`)} />
          </Card>
        </Section>

        <Button
          title="تسجيل الخروج"
          icon="log-out-outline"
          variant="danger"
          onPress={() =>
            Alert.alert('تسجيل الخروج؟', 'راح توقف إشعارات هذا الحساب على هذا الهاتف.', [
              { text: 'رجوع', style: 'cancel' },
              { text: 'خروج', style: 'destructive', onPress: () => void signOut() },
            ])
          }
        />
        <Text variant="caption" color={colors.ink3} center>
          شاشتنا · الإصدار {APP_VERSION}
        </Text>
      </Screen>
    </SafeAreaView>
  );
}

function Toggle({ title, value, onChange, busy }: { title: string; value: boolean; onChange: (value: boolean) => void; busy?: boolean }) {
  return (
    <View style={styles.toggle}>
      <Text style={{ flex: 1 }}>{title}</Text>
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
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.glow, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
});
