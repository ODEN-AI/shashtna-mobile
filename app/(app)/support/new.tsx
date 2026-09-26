import * as Device from 'expo-device';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/src/api/client';
import { APP_VERSION } from '@/src/lib/config';
import { useCreateTicket, useHelp } from '@/src/query/hooks';
import { Button } from '@/src/ui/Button';
import { Field } from '@/src/ui/Field';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, radius, space } from '@/src/ui/theme';

const FALLBACK_CATEGORIES = [
  { value: 'subscription', label: 'الاشتراك' },
  { value: 'playback', label: 'التشغيل والبث' },
  { value: 'payment', label: 'الدفع والطلبات' },
  { value: 'general', label: 'عام' },
];

export default function NewTicketScreen() {
  const params = useLocalSearchParams<{ orderId?: string; subscriptionId?: string; category?: string }>();
  const help = useHelp();
  const create = useCreateTicket();
  const toast = useToast();
  const [category, setCategory] = useState(params.category ?? 'general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const categories = help.data?.categories ?? FALLBACK_CATEGORIES;

  async function submit() {
    if (!subject.trim() || message.trim().length < 5) {
      setError('اكتب عنوان واضح وتفاصيل المشكلة.');
      return;
    }

    setError(null);

    try {
      const result = await create.mutateAsync({
        subject: subject.trim(),
        category,
        message: message.trim(),
        orderId: Number(params.orderId) || undefined,
        subscriptionId: Number(params.subscriptionId) || undefined,
        // Only non-sensitive facts that help support reproduce the issue.
        diagnostics: { appVersion: APP_VERSION, os: `${Platform.OS} ${Platform.Version}`, device: Device.modelName ?? null },
      });

      toast('تم فتح التذكرة ✅');
      router.replace(`/support/${encodeURIComponent(result.ticket.id)}`);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <Screen footer={<Button title="إرسال" icon="send" loading={create.isPending} onPress={submit} />}>
      {params.orderId || params.subscriptionId ? (
        <Notice tone="info">التذكرة راح تنربط تلقائيًا {params.orderId ? 'بالطلب' : 'بالاشتراك'}.</Notice>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <View style={{ gap: space.sm }}>
        <Text variant="label" color={colors.ink2}>
          القسم
        </Text>
        <View style={styles.chips}>
          {categories.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setCategory(item.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: category === item.value }}
              style={[styles.chip, category === item.value && styles.chipActive]}
            >
              <Text variant="label" color={category === item.value ? colors.ink : colors.ink2}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Field label="العنوان" value={subject} onChangeText={setSubject} maxLength={120} placeholder="مثال: القنوات تقطع بالليل" />
      <Field
        label="التفاصيل"
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={4000}
        style={{ minHeight: 140, textAlignVertical: 'top' }}
        placeholder="اشرح المشكلة، ومتى تصير، وعلى أي جهاز."
      />
      <Text variant="caption" color={colors.ink3}>
        نرفق تلقائيًا إصدار التطبيق ونوع الجهاز حتى نساعدك أسرع. ما نرسل أي بيانات حساسة.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 40, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  chipActive: { borderColor: colors.brand, backgroundColor: 'rgba(47,107,255,0.18)' },
});
