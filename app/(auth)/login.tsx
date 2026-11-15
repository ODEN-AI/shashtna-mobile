import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { errorMessage } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthProvider';
import { AuthScene } from '@/src/features/AuthScene';
import { Button } from '@/src/ui/Button';
import { Field } from '@/src/ui/Field';
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
    <AuthScene
      title="تسجيل الدخول"
      subtitle="بنفس حسابك بموقع شاشتنا"
      footer={
        <View style={styles.row}>
          <Text color={colors.ink2}>ما عندك حساب؟</Text>
          <Link href="/register" replace style={styles.link} testID="go-register">
            <Text variant="label" color={colors.ink}>
              أنشئ حساب
            </Text>
          </Link>
        </View>
      }
    >
      {signOutReason && !error ? <Notice tone="warning">{signOutReason}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Field
        variant="pill"
        icon="call-outline"
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
        variant="pill"
        icon="lock-closed-outline"
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

      <Link href="/forgot-password" style={styles.forgot}>
        <Text variant="label" color={colors.brandInk}>
          نسيت كلمة المرور؟
        </Text>
      </Link>

      <Button title="دخول" onPress={submit} loading={busy} testID="login-submit" />
    </AuthScene>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  link: { paddingVertical: space.sm },
  forgot: { alignSelf: 'flex-end', paddingVertical: space.xs, marginTop: -space.sm },
});
