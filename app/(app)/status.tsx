import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { Incident } from '@/src/api/types';
import { formatDateTime } from '@/src/lib/format';
import { COMPONENT_LABEL, INCIDENT_STATUS } from '@/src/lib/status';
import { useServiceStatus } from '@/src/query/hooks';
import { Badge } from '@/src/ui/Badge';
import { Card } from '@/src/ui/Card';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Section } from '@/src/ui/Section';
import { Text } from '@/src/ui/Text';
import { colors, space, toneColor } from '@/src/ui/theme';

/** Incidents published by the Shashtna team (same records as the website's /status). */
export default function StatusScreen() {
  const query = useServiceStatus();

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <QueryBoundary query={query}>
        {(data) => (
          <>
            <Card style={styles.overall} glow={data.overall === 'OPERATIONAL'}>
              <Ionicons
                name={data.overall === 'OPERATIONAL' ? 'checkmark-circle' : data.overall === 'OUTAGE' ? 'close-circle' : 'warning'}
                size={40}
                color={data.overall === 'OPERATIONAL' ? colors.success : data.overall === 'OUTAGE' ? colors.danger : colors.warning}
              />
              <Text variant="heading" center>
                {data.overall === 'OPERATIONAL' ? 'كل الخدمات تشتغل طبيعي' : data.overall === 'OUTAGE' ? 'اكو عطل معلن حاليًا' : 'اكو تنبيه على الخدمة'}
              </Text>
              <Text variant="caption" color={colors.ink3} center>
                هاي الحالة ينشرها فريق شاشتنا — وليست مراقبة آلية.
              </Text>
            </Card>

            {data.active.length ? (
              <Section title="حاليًا">
                {data.active.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </Section>
            ) : null}

            {data.resolved.length ? (
              <Section title="تم حلها مؤخرًا">
                {data.resolved.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </Section>
            ) : null}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const meta = INCIDENT_STATUS[incident.status];

  return (
    <Card style={{ gap: space.sm, borderColor: `${toneColor[meta.tone]}44` }}>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Badge label={incident.upcoming ? 'مجدولة' : meta.label} tone={meta.tone} dot />
        <Badge label={COMPONENT_LABEL[incident.component] ?? incident.component} />
      </View>
      <Text variant="label">{incident.title}</Text>
      <Text variant="caption" color={colors.ink2}>
        {incident.message}
      </Text>
      <Text variant="caption" color={colors.ink3}>
        {incident.resolvedAt ? `تم الحل ${formatDateTime(incident.resolvedAt)}` : `${incident.upcoming ? 'تبدأ' : 'بدأت'} ${formatDateTime(incident.startsAt)}`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  overall: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
});
