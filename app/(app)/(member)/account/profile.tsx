import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { authApi } from '@/src/api/auth';
import { errorMessage } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthProvider';
import { Button } from '@/src/ui/Button';
import { Field } from '@/src/ui/Field';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, radius, space } from '@/src/ui/theme';

const CONTACTS = [
  { value: 'WHATSAPP', label: 'واتساب' },
  { value: 'TELEGRAM', label: 'تيليجرام' },
  { value: 'FACEBOOK', label: 'فيسبوك' },
  { value: 'PHONE', label: 'اتصال' },
];

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [contact, setContact] = useState(user?.preferredContact ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);

    try {
      const result = await authApi.updateMe({ name: name.trim(), preferredContact: contact || null });
      updateUser(result.user);
      toast('تم الحفظ');
      router.back();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title="حفظ" loading={busy} onPress={save} />}>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label="الاسم" value={name} onChangeText={setName} maxLength={120} />
      <Field label="رقم الهاتف" value={user?.phone ?? ''} editable={false} ltr hint="لتغيير الرقم تواصل ويا الدعم." />
      <View style={{ gap: space.sm }}>
        <Text variant="label" color={colors.ink2}>
          طريقة التواصل المفضلة
        </Text>
        <View style={styles.chips}>
          {CONTACTS.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setContact(item.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: contact === item.value }}
              style={[styles.chip, contact === item.value && styles.active]}
            >
              <Text variant="label" color={contact === item.value ? colors.ink : colors.ink2}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: space.lg, minHeight: 40, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  active: { borderColor: colors.brand, backgroundColor: 'rgba(47,107,255,0.18)' },
});
