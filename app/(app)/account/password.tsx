import { router } from 'expo-router';
import { useState } from 'react';

import { authApi } from '@/src/api/auth';
import { errorMessage } from '@/src/api/client';
import { Button } from '@/src/ui/Button';
import { Field } from '@/src/ui/Field';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { useToast } from '@/src/ui/Toast';

export default function PasswordScreen() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (next.length < 6) return setError('كلمة المرور الجديدة لازم تكون 6 أحرف على الأقل.');
    if (next !== confirm) return setError('كلمتا المرور غير متطابقتين.');

    setBusy(true);
    setError(null);

    try {
      const result = await authApi.changePassword(current, next);
      toast(result.message);
      router.back();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title="تغيير كلمة المرور" loading={busy} onPress={save} />}>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Field label="كلمة المرور الحالية" value={current} onChangeText={setCurrent} password autoComplete="current-password" />
      <Field label="كلمة المرور الجديدة" value={next} onChangeText={setNext} password autoComplete="new-password" hint="6 أحرف على الأقل" />
      <Field label="تأكيد كلمة المرور الجديدة" value={confirm} onChangeText={setConfirm} password autoComplete="new-password" />
    </Screen>
  );
}
