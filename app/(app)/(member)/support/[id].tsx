import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/src/api/client';
import type { Ticket } from '@/src/api/types';
import { formatDateTime } from '@/src/lib/format';
import { TICKET_STATUS } from '@/src/lib/status';
import { useTicket, useTicketAction } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Field } from '@/src/ui/Field';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, radius, space } from '@/src/ui/theme';

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = decodeURIComponent(id ?? '');
  const query = useTicket(ticketId);
  const action = useTicketAction(ticketId);
  const [reply, setReply] = useState('');
  const closed = query.data?.status === 'CLOSED';

  return (
    <>
      <Stack.Screen options={{ title: query.data?.subject ?? 'التذكرة' }} />
      <Screen
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        footer={
          query.data ? (
            <View style={{ gap: space.sm }}>
              {action.isError ? <Notice tone="danger">{errorMessage(action.error)}</Notice> : null}
              <Field label={closed ? 'رد جديد يعيد فتح التذكرة' : 'ردّك'} value={reply} onChangeText={setReply} multiline maxLength={4000} />
              <Button
                title="إرسال الرد"
                icon="send"
                disabled={reply.trim().length < 2}
                loading={action.isPending}
                onPress={() => action.mutate({ reply: reply.trim() }, { onSuccess: () => setReply('') })}
              />
            </View>
          ) : null
        }
      >
        <QueryBoundary query={query}>{(ticket) => <Thread ticket={ticket} onClose={() => action.mutate({ close: true })} />}</QueryBoundary>
      </Screen>
    </>
  );
}

function Thread({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const meta = TICKET_STATUS[ticket.status];

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Badge label={meta.label} tone={meta.tone} dot />
        {ticket.status !== 'CLOSED' ? (
          <Button
            title="إغلاق التذكرة"
            variant="ghost"
            compact
            onPress={() =>
              Alert.alert('إغلاق التذكرة؟', 'تكدر ترد عليها لاحقًا حتى تنفتح من جديد.', [
                { text: 'رجوع', style: 'cancel' },
                { text: 'إغلاق', onPress: onClose },
              ])
            }
          />
        ) : null}
      </View>
      {ticket.messages.map((message) => {
        const mine = message.sender === 'CUSTOMER';

        return (
          <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
            <Text variant="caption" color={mine ? colors.brandInk : colors.glow} weight="bold">
              {mine ? 'أنت' : message.senderName ?? 'دعم شاشتنا'}
            </Text>
            <Text selectable>{message.message}</Text>
            <Text variant="caption" color={colors.ink3}>
              {formatDateTime(message.createdAt)}
            </Text>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '88%', padding: space.md, borderRadius: radius.lg, gap: 4 },
  mine: { alignSelf: 'flex-start', backgroundColor: 'rgba(47,107,255,0.16)', borderBottomStartRadius: 4 },
  theirs: { alignSelf: 'flex-end', backgroundColor: colors.surface2, borderBottomEndRadius: 4 },
});
