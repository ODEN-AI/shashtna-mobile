import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthProvider';
import { AuthScene } from '@/src/features/AuthScene';
import { API_BASE_URL } from '@/src/lib/config';
import { Button } from '@/src/ui/Button';
import { Field } from '@/src/ui/Field';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    if (form.name.trim().length < 2 || !form.phone.trim() || !form.password) {
      setError('املأ كل الحقول.');
      return;
    }

    if (form.password.length < 6) {
      setError('كلمة المرور لازم تكون 6 أحرف على الأقل.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (!terms) {
      setError('لازم توافق على الشروط والأحكام.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await register({ name: form.name, phone: form.phone, password: form.password, terms });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScene
      title="حساب جديد"
      subtitle="نفس الحساب يشتغل على الموقع والتطبيق"
      footer={
        <View style={styles.row}>
          <Text color={colors.ink2}>عندك حساب؟</Text>
          <Link href="/login" replace style={styles.link}>
            <Text variant="label" color={colors.ink}>
              سجّل دخولك
            </Text>
          </Link>
        </View>
      }
    >
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field variant="pill" icon="person-outline" label="الاسم" value={form.name} onChangeText={set('name')} autoComplete="name" textContentType="name" testID="register-name" />
      <Field
        variant="pill"
        icon="call-outline"
        label="رقم الهاتف"
        value={form.phone}
        onChangeText={set('phone')}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="07XXXXXXXXX"
        ltr
        testID="register-phone"
      />
      <Field
        variant="pill"
        icon="lock-closed-outline"
        label="كلمة المرور"
        value={form.password}
        onChangeText={set('password')}
        password
        autoComplete="new-password"
        hint="6 أحرف على الأقل"
        testID="register-password"
      />
      <Field
        variant="pill"
        icon="lock-closed-outline"
        label="تأكيد كلمة المرور"
        value={form.confirm}
        onChangeText={set('confirm')}
        password
        autoComplete="new-password"
        testID="register-confirm"
      />

      <Pressable
        onPress={() => setTerms((value) => !value)}
        style={styles.terms}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: terms }}
        accessibilityLabel="أوافق على الشروط والأحكام وسياسة الخصوصية"
        testID="register-terms"
      >
        <Ionicons name={terms ? 'checkbox' : 'square-outline'} size={22} color={terms ? colors.active : colors.ink3} />
        <Text color={colors.ink2} style={{ flex: 1 }}>
          أوافق على{' '}
          <Text color={colors.brandInk} onPress={() => void Linking.openURL(`${API_BASE_URL}/terms`)}>
            الشروط والأحكام
          </Text>{' '}
          و
          <Text color={colors.brandInk} onPress={() => void Linking.openURL(`${API_BASE_URL}/privacy`)}>
            سياسة الخصوصية
          </Text>
        </Text>
      </Pressable>

      <Button title="إنشاء الحساب" onPress={submit} loading={busy} testID="register-submit" />
    </AuthScene>
  );
}

const styles = StyleSheet.create({
  terms: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs, minHeight: 44 },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  link: { paddingVertical: space.sm },
});
