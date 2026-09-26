import { router } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';

import { authApi } from '@/src/api/auth';
import { errorMessage } from '@/src/api/client';
import { useHelp } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { Field } from '@/src/ui/Field';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, space } from '@/src/ui/theme';

/**
 * Same staff-assisted reset as the website: request → staff verify you and
 * give a 6-digit code → set a new password. There is no SMS provider.
 */
export default function ForgotPasswordScreen() {
  const toast = useToast();
  const help = useHelp();
  const [step, setStep] = useState<'request' | 'complete'>('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);

    try {
      await action();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const support = help.data?.support;
  const contact = support?.whatsapp ?? support?.telegram ?? null;

  return (
    <Screen contentStyle={{ padding: space.xl }}>
      <Text variant="title">نسيت كلمة المرور؟</Text>
      <Text color={colors.ink2}>
        {step === 'request'
          ? 'اكتب رقم هاتفك. فريق الدعم يتأكد من هويتك ويعطيك رمز من 6 أرقام.'
          : 'اكتب الرمز اللي استلمته من الدعم وكلمة المرور الجديدة. الرمز صالح لمدة 30 دقيقة.'}
      </Text>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {step === 'request' ? (
        <>
          <Field label="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" ltr placeholder="07XXXXXXXXX" />
          <Button
            title="أرسل الطلب"
            loading={busy}
            onPress={() =>
              run(async () => {
                await authApi.requestReset(phone.trim());
                setStep('complete');
              })
            }
          />
          <Button title="عندي رمز مسبقًا" variant="ghost" onPress={() => setStep('complete')} />
        </>
      ) : (
        <>
          <Card>
            <Text variant="label">الخطوة التالية</Text>
            <Text color={colors.ink2}>تواصل ويا الدعم حتى يتأكدون من هويتك ويعطوك الرمز.</Text>
            {contact ? <Button title="تواصل ويا الدعم" icon="chatbubbles-outline" variant="secondary" compact style={{ marginTop: space.md }} onPress={() => void Linking.openURL(contact)} /> : null}
          </Card>
          <Field label="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" ltr />
          <Field label="الرمز (6 أرقام)" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" ltr />
          <Field label="كلمة المرور الجديدة" value={password} onChangeText={setPassword} password hint="6 أحرف على الأقل" />
          <Button
            title="تغيير كلمة المرور"
            loading={busy}
            onPress={() =>
              run(async () => {
                const result = await authApi.completeReset({ phone: phone.trim(), code, password });
                toast(result.message);
                router.back();
              })
            }
          />
        </>
      )}
    </Screen>
  );
}
