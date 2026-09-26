import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Incident } from '@/src/api/types';
import { COMPONENT_LABEL, INCIDENT_STATUS } from '@/src/lib/status';
import { Card } from '@/src/ui/Card';
import { Text } from '@/src/ui/Text';
import { colors, space, toneBackground, toneColor } from '@/src/ui/theme';

/** Service incidents published by the team (same records as /status on the website). */
export function IncidentBanner({ incidents }: { incidents: Incident[] }) {
  const current = incidents.find((item) => !item.upcoming) ?? incidents[0];

  if (!current) return null;

  const meta = INCIDENT_STATUS[current.status];

  return (
    <Card
      onPress={() => router.push('/status')}
      accessibilityLabel={`${meta.label}: ${current.title}`}
      style={[styles.card, { backgroundColor: toneBackground(meta.tone, 0.1), borderColor: `${toneColor[meta.tone]}55` }]}
    >
      <Ionicons name={meta.icon as never} size={22} color={toneColor[meta.tone]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" color={toneColor[meta.tone]}>
          {current.upcoming ? 'صيانة قادمة' : meta.label} · {COMPONENT_LABEL[current.component] ?? current.component}
        </Text>
        <Text variant="label">{current.title}</Text>
        <Text variant="caption" color={colors.ink2} numberOfLines={2}>
          {current.message}
        </Text>
        {incidents.length > 1 ? (
          <Text variant="caption" color={colors.ink3}>
            +{incidents.length - 1} تنبيه آخر
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
});
