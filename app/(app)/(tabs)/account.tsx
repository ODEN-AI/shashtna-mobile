import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/src/api/auth';
import { errorMessage } from '@/src/api/client';
import type { User } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { GuestGate } from '@/src/features/GuestGate';
import { lookOf, renew } from '@/src/features/home/HomeSections';
import { openWeb } from '@/src/features/web/open';
import { API_BASE_URL, APP_VERSION } from '@/src/lib/config';
import { formatDate } from '@/src/lib/format';
import { usePush } from '@/src/push/PushProvider';
import { useDashboard, useLoyalty } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Panel, Tile } from '@/src/ui/Kit';
import { ListRow } from '@/src/ui/ListRow';
import { Screen } from '@/src/ui/Screen';
import { SettingsGroup } from '@/src/ui/SettingsGroup';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, gradients, radius, rgba, space } from '@/src/ui/theme';

const CONTACT_LABEL: Record<string, string> = { WHATSAPP: 'واتساب', TELEGRAM: 'تيليجرام', FACEBOOK: 'فيسبوك', PHONE: 'اتصال' };

function LegalRows() {
  return [
    <ListRow key="terms" icon="document-text-outline" tone="neutral" title="الشروط والأحكام" onPress={() => void Linking.openURL(`${API_BASE_URL}/terms`)} />,
    <ListRow key="privacy" icon="shield-outline" tone="neutral" title="سياسة الخصوصية" onPress={() => void Linking.openURL(`${API_BASE_URL}/privacy`)} />,
  ];
}

function Version() {
  return (
    <View style={styles.version}>
      <Text variant="micro" color={colors.ink3} center>
        Shashtna App | شاشتنا
      </Text>
      <Text variant="micro" color={colors.ink3} center>
        الإصدار v{APP_VERSION}
      </Text>
    </View>
  );
}

/** «حسابي» (Stitch profile and settings). */
export default function AccountScreen() {
  const { status } = useAuth();
  return status === 'signedIn' ? <MemberAccount /> : <GuestSettings />;
}

/** Guests: sign-in, help and legal — everything that works without an account. */
function GuestSettings() {
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={[]} tabBar contentStyle={[styles.content, { paddingTop: insets.top + space.lg }]}>
      <Text variant="title" weight="bold" accessibilityRole="header">
        حسابي
      </Text>
      <GuestGate icon="person" title="حسابك بشاشتنا" body="نفس حسابك بالموقع. سجّل دخولك حتى تطلب، تتابع اشتراكك، وتوصلك الإشعارات." />
      <SettingsGroup title="المساعدة">
        <ListRow icon="headset-outline" tone="info" title="الدعم والمساعدة" subtitle="الأسئلة الشائعة وقنوات التواصل" onPress={() => router.navigate('/support')} />
        <ListRow icon="pulse-outline" tone="success" title="حالة الخدمة" onPress={() => router.push('/status')} />
      </SettingsGroup>
      <SettingsGroup title="عن شاشتنا">{LegalRows()}</SettingsGroup>
      <Version />
    </Screen>
  );
}

function MemberAccount() {
  const { user, signOut, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const push = usePush();
  const toast = useToast();
  const loyalty = useLoyalty();
  const dashboard = useDashboard();

  // Preferences are stored on the account (same toggles as the website).
  const save = useMutation({
    mutationFn: (input: Partial<User>) => authApi.updateMe(input),
    onSuccess: (result) => updateUser(result.user),
    onError: (error) => toast(errorMessage(error), 'error'),
  });

  if (!user) return null;

  const points = loyalty.data?.enabled ? loyalty.data : null;
  const sub = dashboard.data?.primarySubscription;
  const ending = sub && lookOf(sub) === 'expiring' ? sub : null;

  return (
    <Screen edges={[]} tabBar contentStyle={[styles.content, { paddingTop: insets.top + space.lg }]} refreshing={loyalty.isRefetching} onRefresh={() => void loyalty.refetch()}>
      <Text variant="title" weight="bold" accessibilityRole="header">
        حسابي
      </Text>

      <Panel style={styles.profile} testID="profile-card">
        <View style={[styles.avatar, { experimental_backgroundImage: `linear-gradient(45deg, ${colors.amberDeep}, ${colors.amber})` }]}>
          <Text variant="title" weight="bold" color={colors.onAmber}>
            {user.name.trim().charAt(0)}
          </Text>
        </View>
        <View style={[styles.flex, { gap: 2 }]}>
          <Text variant="heading" weight="bold" numberOfLines={1}>
            {user.name}
          </Text>
          <Pressable
            onPress={() => {
              void Clipboard.setStringAsync(user.phone).then(() => toast('تم نسخ الرقم'));
            }}
            accessibilityRole="button"
            accessibilityLabel={`نسخ الرقم ${user.phone}`}
            style={styles.row}
          >
            <MaterialIcons name="content-copy" size={14} color={colors.ink2} />
            <Text variant="caption" color={colors.ink2} style={{ writingDirection: 'ltr' }}>
              {user.phone}
            </Text>
          </Pressable>
          {user.createdAt ? (
            <View style={styles.row}>
              <MaterialIcons name="calendar-today" size={14} color={colors.ink3} />
              <Text variant="micro" color={colors.ink3}>
                عميل شاشتنا منذ {formatDate(user.createdAt)}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={() => router.push('/account/profile')} hitSlop={10} accessibilityRole="button" accessibilityLabel="تعديل بياناتي" style={styles.edit}>
          <MaterialIcons name="edit" size={20} color={colors.ink2} />
        </Pressable>
      </Panel>

      {points ? (
        <Panel style={styles.points} testID="points-card">
          <View style={styles.between}>
            <View style={styles.flex}>
              <View style={styles.row}>
                <MaterialIcons name="diamond" size={14} color={colors.amber} />
                <Text variant="micro" color={colors.amber}>
                  رصيد نقاط شاشتنا
                </Text>
              </View>
              <Text variant="display" weight="bold" style={styles.nums}>
                {points.balance.toLocaleString('en-US')}
              </Text>
            </View>
            <Tile icon="redeem" color={colors.amber} size={48} />
          </View>
          <View style={styles.between}>
            <Text variant="micro" color={colors.ink2} style={styles.nums}>
              {points.progress.current} / {points.progress.target}
            </Text>
          </View>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${points.progress.target ? Math.min(100, Math.round((points.progress.current / points.progress.target) * 100)) : 0}%`,
                  experimental_backgroundImage: `linear-gradient(270deg, ${colors.amberDeep}, ${colors.amber})`,
                },
              ]}
            />
          </View>
          <Text variant="caption" color={colors.ink2}>
            🎁 {points.progress.messageAr}
          </Text>
          <Pressable onPress={() => openWeb('/points', 'نقاط شاشتنا')} accessibilityRole="button" style={styles.pointsLink}>
            <Text variant="label" color={colors.amber}>
              سجل حركات النقاط واستبدالها
            </Text>
            <MaterialIcons name="arrow-back" size={16} color={colors.amber} />
          </Pressable>
        </Panel>
      ) : null}

      <SettingsGroup title="إشعارات وتنبيهات التجديد">
        {ending ? (
          <View style={styles.alertRow} key="ending">
            <Tile icon="timer" color={colors.amber} />
            <View style={styles.flex}>
              <Text variant="label" weight="semibold" numberOfLines={1}>
                تنبيه تجديد {ending.packageName}
              </Text>
              <Text variant="micro" color={colors.amber}>
                باقي {Math.max(0, ending.daysRemaining)} يوم على الانتهاء
              </Text>
            </View>
            <Button title="تجديد" compact onPress={() => renew(ending)} />
          </View>
        ) : null}
        <Toggle title="تنبيه قبل انتهاء الاشتراك" subtitle="نذكّرك بالتطبيق قبل ما ينتهي اشتراكك" value={user.renewalReminders} busy={save.isPending} onChange={(value) => save.mutate({ renewalReminders: value })} />
        <Toggle title="العروض والخصومات" subtitle="خصومات الباقات وعروض شاشتنا" value={user.marketingOptIn} busy={save.isPending} onChange={(value) => save.mutate({ marketingOptIn: value })} />
        <ListRow
          icon={push.permission === 'granted' ? 'notifications' : 'notifications-off-outline'}
          tone={push.permission === 'granted' ? 'success' : 'warning'}
          title={push.permission === 'granted' ? 'إشعارات الهاتف مفعّلة' : push.permission === 'unavailable' ? 'الإشعارات غير متاحة على هذا الجهاز' : 'إشعارات الهاتف مطفية'}
          subtitle="الطلبات والدفع والتفعيل وردود الدعم"
          trailing={push.permission === 'granted' || push.permission === 'unavailable' ? null : <Button title="تفعيل" compact onPress={() => void push.enable()} />}
        />
        <ListRow icon="pulse-outline" tone="info" title="فحص الإشعارات" subtitle="تأكد إن هاتفك يستلم إشعارات شاشتنا" onPress={() => router.push('/account/notifications-check')} />
      </SettingsGroup>

      <SettingsGroup title="الحساب والأمان">
        <ListRow icon="key-outline" title="تغيير كلمة المرور" onPress={() => router.push('/account/password')} />
        <ListRow
          icon="chatbubble-ellipses-outline"
          title="طريقة التواصل المفضلة"
          subtitle={user.preferredContact ? CONTACT_LABEL[user.preferredContact] : 'غير محددة'}
          onPress={() => router.push('/account/profile')}
        />
        <ListRow icon="receipt-outline" title="سجل الطلبات" subtitle="كل طلباتك وحالتها" onPress={() => router.push('/orders')} />
        <ListRow icon="document-text-outline" title="الإيصالات" subtitle="إيصالات الطلبات المكتملة" onPress={() => openWeb('/receipts', 'الإيصالات')} />
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
        {LegalRows()}
      </SettingsGroup>

      <Button title="مركز المساعدة والتواصل ويا فريق الدعم" icon="headset-outline" onPress={() => router.navigate('/support')} />

      <Button
        title="تسجيل الخروج من الحساب"
        icon="log-out-outline"
        variant="ghost"
        testID="sign-out"
        style={styles.signOut}
        onPress={() =>
          Alert.alert('تسجيل الخروج؟', 'راح توقف إشعارات هذا الحساب على هذا الهاتف.', [
            { text: 'رجوع', style: 'cancel' },
            { text: 'خروج', style: 'destructive', onPress: () => void signOut() },
          ])
        }
      />
      <Version />
    </Screen>
  );
}

function Toggle({ title, subtitle, value, onChange, busy }: { title: string; subtitle: string; value: boolean; onChange: (value: boolean) => void; busy?: boolean }) {
  return (
    <View style={styles.toggle}>
      <View style={styles.flex}>
        <Text variant="label" weight="semibold">
          {title}
        </Text>
        <Text variant="micro" color={colors.ink2}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={busy}
        trackColor={{ true: colors.brand, false: colors.surface3 }}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, gap: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.amber },
  edit: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  points: { gap: space.sm, backgroundColor: colors.surface2, experimental_backgroundImage: `linear-gradient(160deg, ${gradients.hero.join(', ')})` },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.surface3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  pointsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, minHeight: 44, marginTop: space.sm, borderRadius: radius.md, backgroundColor: rgba(colors.amberDeep, 0.12) },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 72 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64 },
  signOut: { marginTop: -space.md },
  version: { alignItems: 'center', gap: 2, paddingTop: space.sm },
});
