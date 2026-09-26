import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthProvider';
import { AuthHeader } from '@/src/features/AuthHeader';
import { Button } from '@/src/ui/Button';
import { Field } from '@/src/ui/Field';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export default function LoginScreen() {
  const { signIn, signOutReason } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function submit() {
    if (!phone.trim() || !password) {
      setError('اكتب رقم الهاتف وكلمة المرور.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await signIn(phone, password);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <Screen contentStyle={styles.content}>
        <AuthHeader title="أهلًا بيك بشاشتنا" subtitle="سجّل دخولك بنفس حسابك بالموقع" />

        {signOutReason && !error ? <Notice tone="warning">{signOutReason}</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <Field
          label="رقم الهاتف"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          placeholder="07XXXXXXXXX"
          ltr
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          testID="login-phone"
        />
        <Field
          ref={passwordRef}
          label="كلمة المرور"
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          testID="login-password"
        />

        <Button title="تسجيل الدخول" onPress={submit} loading={busy} testID="login-submit" />

        <View style={styles.links}>
          <Link href="/forgot-password" style={styles.link}>
            <Text variant="label" color={colors.brandInk}>
              نسيت كلمة المرور؟
            </Text>
          </Link>
          <View style={styles.row}>
            <Text color={colors.ink2}>ما عندك حساب؟</Text>
            <Link href="/register" style={styles.link}>
              <Text variant="label" color={colors.brandInk}>
                أنشئ حساب
              </Text>
            </Link>
          </View>
        </View>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingTop: space.xxl * 2, gap: space.lg },
  links: { alignItems: 'center', gap: space.lg, marginTop: space.md },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  link: { paddingVertical: space.sm },
});
