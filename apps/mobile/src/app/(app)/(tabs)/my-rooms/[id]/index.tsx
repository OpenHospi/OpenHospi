import { RoomStatus } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PhotoCarousel } from '@/components/photo-carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useDeleteRoom, useMyRoom, useUpdateRoomStatus } from '@/services/my-rooms';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [RoomStatus.active]: 'default',
  [RoomStatus.draft]: 'outline',
  [RoomStatus.paused]: 'secondary',
  [RoomStatus.closed]: 'destructive',
};

export default function MyRoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(id);
  const updateStatus = useUpdateRoomStatus();
  const deleteRoom = useDeleteRoom();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === RoomStatus.closed) {
      Alert.alert(t('status.confirmCloseTitle'), t('status.confirmClose'), [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: tCommon('confirm'),
          style: 'destructive',
          onPress: () => updateStatus.mutate({ roomId: id, status: newStatus }),
        },
      ]);
    } else {
      updateStatus.mutate({ roomId: id, status: newStatus });
    }
  };

  const handleDelete = () => {
    Alert.alert(t('status.confirmDeleteTitle'), t('status.confirmDelete'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteRoom.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading || !room) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  const status = room.status;

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Photos */}
        <PhotoCarousel photos={room.photos} bucket="room-photos" />

        <View style={{ padding: 16, gap: 16 }}>
          {/* Title + Status */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className="text-foreground text-xl font-bold" style={{ flex: 1 }}>
              {room.title || tEnums('room_status.draft')}
            </Text>
            <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'outline'}>
              <Text>{tEnums(`room_status.${status}`)}</Text>
            </Badge>
          </View>

          {/* Location */}
          <Text variant="muted" className="text-sm">
            {tEnums(`city.${room.city}`)}
            {room.neighborhood ? ` - ${room.neighborhood}` : ''}
          </Text>

          {room.description && <Text className="text-foreground text-sm">{room.description}</Text>}

          {/* Pricing Card */}
          <Card style={{ gap: 8 }}>
            <Text className="text-foreground font-semibold">{t('wizard.sections.pricing')}</Text>
            <Row label={t('fields.rentPrice')} value={`€${room.rentPrice}`} />
            {room.deposit != null && <Row label={t('fields.deposit')} value={`€${room.deposit}`} />}
            {room.serviceCosts != null && (
              <Row label={t('fields.serviceCosts')} value={`€${room.serviceCosts}`} />
            )}
            <Row label={tCommon('total')} value={`€${room.totalCost}`} bold />
          </Card>

          {/* Property Card */}
          <Card style={{ gap: 8 }}>
            <Text className="text-foreground font-semibold">{t('wizard.sections.property')}</Text>
            {room.houseType && (
              <Row label={t('fields.houseType')} value={tEnums(`house_type.${room.houseType}`)} />
            )}
            {room.furnishing && (
              <Row label={t('fields.furnishing')} value={tEnums(`furnishing.${room.furnishing}`)} />
            )}
            {room.roomSizeM2 && <Row label={t('fields.roomSize')} value={`${room.roomSizeM2}m²`} />}
            {room.rentalType && (
              <Row
                label={t('fields.rentalType')}
                value={tEnums(`rental_type.${room.rentalType}`)}
              />
            )}
            {room.totalHousemates != null && (
              <Row label={t('fields.totalHousemates')} value={String(room.totalHousemates)} />
            )}
          </Card>

          {/* Features */}
          {room.features.length > 0 && (
            <Card style={{ gap: 8 }}>
              <Text className="text-foreground font-semibold">{t('fields.features')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {room.features.map((f) => (
                  <Badge key={f} variant="secondary" className="rounded-lg px-2 py-1">
                    <Text>{tEnums(`room_feature.${f}`)}</Text>
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Location Tags */}
          {room.locationTags.length > 0 && (
            <Card style={{ gap: 8 }}>
              <Text className="text-foreground font-semibold">{t('fields.locationTags')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {room.locationTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-lg px-2 py-1">
                    <Text>{tEnums(`location_tag.${tag}`)}</Text>
                  </Badge>
                ))}
              </View>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 8 }}>
            <Button
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/my-rooms/[id]/edit',
                  params: { id },
                })
              }>
              <Text>{t('actions.edit')}</Text>
            </Button>

            <Button
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/my-rooms/[id]/share-link',
                  params: { id },
                })
              }>
              <Text>{t('shareLink.title')}</Text>
            </Button>

            {status === RoomStatus.draft && (
              <Button variant="destructive" onPress={handleDelete}>
                <Text>{t('actions.deleteDraft')}</Text>
              </Button>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Status Action */}
      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        {status === RoomStatus.draft && (
          <Button onPress={() => handleStatusChange(RoomStatus.active)}>
            <Text>{t('actions.publish')}</Text>
          </Button>
        )}
        {status === RoomStatus.active && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button variant="outline" onPress={() => handleStatusChange(RoomStatus.paused)}>
                <Text>{t('actions.pause')}</Text>
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="destructive" onPress={() => handleStatusChange(RoomStatus.closed)}>
                <Text>{t('actions.close')}</Text>
              </Button>
            </View>
          </View>
        )}
        {status === RoomStatus.paused && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button onPress={() => handleStatusChange(RoomStatus.active)}>
                <Text>{t('actions.activate')}</Text>
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="destructive" onPress={() => handleStatusChange(RoomStatus.closed)}>
                <Text>{t('actions.close')}</Text>
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="muted" className="text-sm">
        {label}
      </Text>
      <Text className={bold ? 'text-foreground font-bold' : 'text-foreground text-sm'}>
        {value}
      </Text>
    </View>
  );
}
