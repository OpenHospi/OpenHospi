import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useCancelEvent, useEventDetail } from '@/services/my-rooms';
import type { EventInvitee } from '@openhospi/shared/api-types';

const RSVP_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  attending: 'default',
  not_attending: 'destructive',
  maybe: 'secondary',
  pending: 'outline',
};

export default function EventDetailScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });

  const { data: event, isLoading } = useEventDetail(id, eventId);
  const cancelEvent = useCancelEvent();

  if (isLoading || !event) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  const isCancelled = !!event.cancelledAt;

  const handleCancel = () => {
    Alert.alert(t('cancelConfirmTitle'), t('cancelConfirmDescription'), [
      { text: t('keepEvent'), style: 'cancel' },
      {
        text: t('confirmCancel'),
        style: 'destructive',
        onPress: () => {
          cancelEvent.mutate({ roomId: id, eventId });
          router.back();
        },
      },
    ]);
  };

  const renderInvitee = ({ item }: { item: EventInvitee }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;

    return (
      <View
        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}
        className="border-border border-b">
        <View className="bg-muted overflow-hidden rounded-full" style={{ width: 40, height: 40 }}>
          {avatarUri && <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40 }} />}
        </View>
        <Text className="text-foreground text-sm" style={{ flex: 1 }}>
          {item.firstName} {item.lastName}
        </Text>
        <Badge variant={RSVP_BADGE_VARIANT[item.status ?? 'pending'] ?? 'outline'}>
          <Text>{tEnums(`invitation_status.${item.status ?? 'pending'}`)}</Text>
        </Badge>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 16, gap: 16 }}>
          {/* Event info */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text className="text-foreground text-xl font-bold">{event.title}</Text>
              {isCancelled && (
                <Badge variant="destructive">
                  <Text>{t('cancelled')}</Text>
                </Badge>
              )}
            </View>

            <Text variant="muted" className="text-sm">
              {event.eventDate} {event.timeStart}
              {event.timeEnd ? ` - ${event.timeEnd}` : ''}
            </Text>
            {event.location && (
              <Text variant="muted" className="text-sm">
                {event.location}
              </Text>
            )}
            {event.description && (
              <Text className="text-foreground text-sm">{event.description}</Text>
            )}
            {event.notes && (
              <Text variant="muted" className="text-sm italic">
                {event.notes}
              </Text>
            )}
            {event.maxAttendees && (
              <Text variant="muted" className="text-xs">
                {t('maxAttendees', { count: event.maxAttendees })}
              </Text>
            )}
          </View>

          {/* Attending summary */}
          <Text variant="muted" className="text-sm">
            {t('attendingCount', {
              attending: event.invitees.filter((i) => i.status === 'attending').length,
              total: event.invitees.length,
            })}
          </Text>

          {/* Invitees */}
          <View style={{ gap: 8 }}>
            <Text className="text-foreground font-semibold">{t('invitees')}</Text>
            {event.invitees.length === 0 ? (
              <Text variant="muted" className="text-sm">
                {t('noInvitees')}
              </Text>
            ) : (
              event.invitees.map((invitee) => (
                <View key={invitee.invitationId}>{renderInvitee({ item: invitee })}</View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      {!isCancelled && (
        <View
          style={{ padding: 16, paddingBottom: 32, gap: 8 }}
          className="border-border bg-background border-t">
          <Button
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/my-rooms/[id]/events/invite',
                params: { id, eventId },
              })
            }>
            <Text>{t('invitees')}</Text>
          </Button>
          <Button variant="destructive" onPress={handleCancel}>
            <Text>{t('cancelEvent')}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
