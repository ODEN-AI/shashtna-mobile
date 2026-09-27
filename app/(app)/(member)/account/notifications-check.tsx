import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/src/api/client';
import { formatDateTime } from '@/src/lib/format';
import { usePush } from '@/src/push/PushProvider';
import { isPushCapable, pushProjectConfigured, readPushStatus } from '@/src/push/push';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { ListRow } from '@/src/ui/ListRow';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { useToast } from '@/src/ui/Toast';
import { colors, space } from '@/src/ui/theme';

/**
 * Tells the customer (and support) whether this phone can receive Shashtna
 * push notifications, and re-registers it on demand. No token is shown.
 */
export default function NotificationsCheckScreen() {
  const push = usePush();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const status = useQuery({ queryKey: ['push-status'], queryFn: readPushStatus, staleTime: 0 });

  const checks = [
    { ok: isPushCapable(), title: 'هاتف حقيقي يدعم الإشعارات', fail: 'المحاكي أو هذا الجهاز ما يدعم إشعارات الهاتف.' },
    { ok: pushProjectConfigured(), title: 'نسخة التطبيق مجهزة للإشعارات', fail: 'هذه النسخة بدون إعداد الإشعارات. نزّل النسخة الرسمية.' },
    { ok: push.permission === 'granted', title: 'الإذن بالإشعارات', fail: push.permission === 'denied' ? 'الإشعارات مرفوضة من إعدادات الهاتف.' : 'ما انطى الإذن بعد.' },
    { ok: Boolean(status.data?.ok), title: 'الهاتف مسجل بحسابك', fail: status.data?.detail ?? 'ما تم التسجيل بعد.' },
  ];

  return (
    <Screen>
      <Card style={{ paddingVertical: 0 }}>
        {checks.map((check) => (
          <ListRow
            key={check.title}
            icon={check.ok ? 'checkmark-circle' : 'close-circle'}
            tone={check.ok ? 'success' : 'danger'}
            title={check.title}
            subtitle={check.ok ? null : check.fail}
          />
        ))}
      </Card>

      {status.data ? (
        <Text variant="caption" color={colors.ink3}>
          آخر محاولة تسجيل: {formatDateTime(status.data.at)}
        </Text>
      ) : null}

      <View style={{ gap: space.sm }}>
        {push.permission !== 'granted' && push.permission !== 'unavailable' ? (
          <Button title={push.permission === 'denied' ? 'افتح إعدادات الإشعارات' : 'فعّل الإشعارات'} onPress={() => void push.enable().then(() => status.refetch())} />
        ) : null}
        <Button
          title="إعادة تسجيل الهاتف"
          icon="refresh"
          variant="secondary"
          loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await push.reregister();
              toast('تم التحقق');
            } catch (error) {
              toast(errorMessage(error), 'error');
            } finally {
              setBusy(false);
              void status.refetch();
            }
          }}
        />
      </View>

      <Notice tone="info">إذا كل الفحوصات سليمة، تكدر تطلب من الدعم يرسلون إشعار تجريبي لحسابك.</Notice>
    </Screen>
  );
}
