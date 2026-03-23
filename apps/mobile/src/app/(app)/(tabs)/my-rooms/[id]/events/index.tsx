import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useRoomEvents } from '@/services/my-rooms';
import type { EventSummary } from '@openhospi/shared/api-types';

export default function EventsListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });

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
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  if (!events || events.length === 0) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}
        className="bg-background">
        <Text variant="muted" className="text-center text-base">
          {t('empty')}
        </Text>
        <Button
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/my-rooms/[id]/events/create',
              params: { id },
            })
          }>
          <Text>{t('create')}</Text>
        </Button>
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
          style={{ padding: 16, gap: 4, opacity: isCancelled ? 0.5 : 1 }}
          className="border-border border-b">
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className="text-foreground font-semibold">{item.title}</Text>
            {isCancelled && (
              <Badge variant="destructive">
                <Text>{t('cancelled')}</Text>
              </Badge>
            )}
          </View>
          <Text variant="muted" className="text-sm">
            {item.eventDate} {item.timeStart}
            {item.timeEnd ? ` - ${item.timeEnd}` : ''}
          </Text>
          {item.location && (
            <Text variant="muted" className="text-sm">
              {item.location}
            </Text>
          )}
          <Text variant="muted" className="text-xs">
            {t('attendingCount', { attending: item.attendingCount, total: item.invitedCount })}
          </Text>
        </View>
      </Pressable>
    );
  };

  const sections = [
    ...(upcoming.length > 0 ? [{ title: t('upcoming'), data: upcoming }] : []),
    ...(past.length > 0 ? [{ title: t('past'), data: past }] : []),
  ];

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <FlatList
        data={sections}
        keyExtractor={(section) => section.title}
        renderItem={({ item: section }) => (
          <View>
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }} className="bg-muted/30">
              <Text className="text-foreground text-sm font-semibold">{section.title}</Text>
            </View>
            {section.data.map((event) => (
              <View key={event.id}>{renderEvent({ item: event })}</View>
            ))}
          </View>
        )}
      />
      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/my-rooms/[id]/events/create',
              params: { id },
            })
          }>
          <Text>{t('create')}</Text>
        </Button>
      </View>
    </View>
  );
}
