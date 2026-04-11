import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { useRoomEvents } from '@/services/my-rooms';
import type { EventSummary } from '@openhospi/shared/api-types';

export default function EventsListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { colors } = useTheme();

  const { data: events, isLoading } = useRoomEvents(id);

  const today = new Date().toISOString().split('T')[0];
  const { upcoming, past } = useMemo(() => {
    if (!events) return { upcoming: [], past: [] };
    const up: EventSummary[] = [];
    const pa: EventSummary[] = [];
    for (const event of events) {
      if (event.eventDate >= today) {
        up.push(event);
      } else {
        pa.push(event);
      }
    }
    return { upcoming: up, past: pa };
  }, [events, today]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!events || events.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <ThemedText variant="body" color={colors.tertiaryForeground} style={styles.textCenter}>
          {t('empty')}
        </ThemedText>
        <ThemedButton
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/my-rooms/[id]/events/create',
              params: { id },
            })
          }>
          {t('create')}
        </ThemedButton>
      </View>
    );
  }

  const renderEvent = ({ item }: { item: EventSummary }) => {
    const isCancelled = !!item.cancelledAt;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/my-rooms/[id]/events/[eventId]',
            params: { id, eventId: item.id },
          })
        }>
        <View
          style={[
            styles.eventRow,
            { opacity: isCancelled ? 0.5 : 1, borderBottomColor: colors.border },
          ]}>
          <View style={styles.eventTitleRow}>
            <ThemedText variant="body" weight="600">
              {item.title}
            </ThemedText>
            {isCancelled && <ThemedBadge variant="destructive" label={t('cancelled')} />}
          </View>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {item.eventDate} {item.timeStart}
            {item.timeEnd ? ` - ${item.timeEnd}` : ''}
          </ThemedText>
          {item.location && (
            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {item.location}
            </ThemedText>
          )}
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('attendingCount', { attending: item.attendingCount, total: item.invitedCount })}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const sections = [
    ...(upcoming.length > 0 ? [{ title: t('upcoming'), data: upcoming }] : []),
    ...(past.length > 0 ? [{ title: t('past'), data: past }] : []),
  ];

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <FlatList
        data={sections}
        keyExtractor={(section) => section.title}
        renderItem={({ item: section }) => (
          <View>
            <View style={[styles.sectionHeader, { backgroundColor: `${colors.muted}4D` }]}>
              <ThemedText variant="subheadline" weight="600">
                {section.title}
              </ThemedText>
            </View>
            {section.data.map((event) => (
              <View key={event.id}>{renderEvent({ item: event })}</View>
            ))}
          </View>
        )}
      />
      <View
        style={[
          styles.bottomBar,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}>
        <ThemedButton
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/my-rooms/[id]/events/create',
              params: { id },
            })
          }>
          {t('create')}
        </ThemedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  textCenter: {
    textAlign: 'center',
  },
  eventRow: {
    padding: 16,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
