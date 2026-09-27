import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { useRequireAuth } from '@/src/auth/useRequireAuth';
import { formatRelative } from '@/src/lib/format';
import { TICKET_STATUS } from '@/src/lib/status';
import { useHelp, useTickets } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { EmptyState } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, space } from '@/src/ui/theme';

/** Tickets (website ticket system), FAQ and contact channels from Admin → Settings. */
export default function SupportScreen() {
  const tickets = useTickets();
  const { signedIn, go } = useRequireAuth();
  const help = useHelp();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const support = help.data?.support;
  const channels = [
    support?.whatsapp ? { label: 'واتساب', icon: 'logo-whatsapp' as const, url: support.whatsapp } : null,
    support?.telegram ? { label: 'تيليجرام', icon: 'paper-plane-outline' as const, url: support.telegram } : null,
    support?.phone ? { label: 'اتصال', icon: 'call-outline' as const, url: `tel:${support.phone.replace(/[^\d+]/g, '')}` } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <Screen
      refreshing={tickets.isRefetching}
      onRefresh={() => {
        void tickets.refetch();
        void help.refetch();
      }}
    >
      <Button title="تذكرة دعم جديدة" icon="add-circle-outline" onPress={() => go('/support/new')} />

      {channels.length ? (
        <Card style={{ gap: space.md }}>
          <Text variant="label">تواصل مباشر{support?.hours ? ` · ${support.hours}` : ''}</Text>
          <View style={styles.channels}>
            {channels.map((channel) => (
              <Button key={channel.label} title={channel.label} icon={channel.icon} variant="glass" compact style={{ flex: 1 }} onPress={() => void Linking.openURL(channel.url)} />
            ))}
          </View>
        </Card>
      ) : null}

      <Section title="تذاكري">
        {!signedIn ? (
          <EmptyState icon="chatbubbles-outline" title="تذاكرك تظهر هنا" body="سجّل دخولك حتى تفتح تذكرة وتتابع ردود فريق الدعم." action={<Button title="تسجيل الدخول" variant="glass" onPress={() => router.push('/login')} />} />
        ) : (
        <QueryBoundary query={tickets} rows={2}>
          {(list) =>
            list.length ? (
              list.map((ticket) => {
                const meta = TICKET_STATUS[ticket.status];

                return (
                  <Card key={ticket.id} onPress={() => router.push(`/support/${encodeURIComponent(ticket.id)}`)} style={{ gap: space.sm }} accessibilityLabel={ticket.subject}>
                    <View style={styles.row}>
                      <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                        {ticket.subject}
                      </Text>
                      <Badge label={meta.label} tone={meta.tone} />
                    </View>
                    {ticket.lastMessage ? (
                      <Text variant="caption" color={colors.ink2} numberOfLines={2}>
                        {ticket.lastSender === 'ADMIN' ? 'الدعم: ' : 'أنت: '}
                        {ticket.lastMessage}
                      </Text>
                    ) : null}
                    <Text variant="caption" color={colors.ink3}>
                      آخر تحديث {formatRelative(ticket.updatedAt)}
                    </Text>
                  </Card>
                );
              })
            ) : (
              <EmptyState icon="chatbubbles-outline" title="ما عندك تذاكر" body="إذا واجهتك مشكلة افتح تذكرة وفريقنا يرد عليك هنا." />
            )
          }
        </QueryBoundary>
        )}
      </Section>

      {help.data?.faq.length ? (
        <Section title="أسئلة شائعة">
          <Card style={{ paddingVertical: space.sm }}>
            {help.data.faq.map((item, index) => {
              const open = openFaq === item.id;

              return (
                <View key={item.id} style={[styles.faq, index > 0 && styles.divider]}>
                  <Pressable
                    onPress={() => setOpenFaq(open ? null : item.id)}
                    style={styles.faqHead}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                  >
                    <Text variant="label" style={{ flex: 1 }}>
                      {item.question}
                    </Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink3} />
                  </Pressable>
                  {open ? <Text color={colors.ink2}>{item.answer}</Text> : null}
                </View>
              );
            })}
          </Card>
        </Section>
      ) : null}

      <Button title="حالة الخدمة" icon="pulse-outline" variant="ghost" onPress={() => router.push('/status')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  channels: { flexDirection: 'row', gap: space.sm },
  faq: { paddingVertical: space.md, gap: space.sm },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 32 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
});
