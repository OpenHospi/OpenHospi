import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useMyRoom, usePublishRoom } from '@/services/my-rooms';

export default function ReviewScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(roomId);
  const publishRoom = usePublishRoom();

  const handlePublish = async () => {
    try {
      await publishRoom.mutateAsync(roomId);
      router.dismissAll();
    } catch {
      Alert.alert(t('status.publishError'));
    }
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

  const photos = room.photos ?? [];
  const canPublish = photos.length > 0;

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {/* Photos preview */}
        {photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}>
            {photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: getStoragePublicUrl(photo.url, 'room-photos') }}
                style={{ width: 200, aspectRatio: 4 / 3, borderRadius: 12 }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        )}

        {/* Basic Info */}
        <Card style={{ gap: 8 }}>
          <Text className="text-foreground text-lg font-semibold">
            {room.title || tEnums('room_status.draft')}
          </Text>
          <Text variant="muted" className="text-sm">
            {tEnums(`city.${room.city}`)}
            {room.neighborhood ? ` - ${room.neighborhood}` : ''}
          </Text>
          {room.description && <Text className="text-foreground text-sm">{room.description}</Text>}
        </Card>

        {/* Pricing */}
        <Card style={{ gap: 8 }}>
          <Text className="text-foreground font-semibold">{t('wizard.sections.pricing')}</Text>
          <Row label={t('fields.rentPrice')} value={`€${room.rentPrice}`} />
          {room.deposit != null && <Row label={t('fields.deposit')} value={`€${room.deposit}`} />}
          {room.serviceCosts != null && (
            <Row label={t('fields.serviceCosts')} value={`€${room.serviceCosts}`} />
          )}
          <Row label={tCommon('total')} value={`€${room.totalCost}`} bold />
        </Card>

        {/* Property */}
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
            <Row label={t('fields.rentalType')} value={tEnums(`rental_type.${room.rentalType}`)} />
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

        {/* Preferences */}
        <Card style={{ gap: 8 }}>
          <Text className="text-foreground font-semibold">{t('wizard.sections.preferences')}</Text>
          {room.preferredGender && (
            <Row
              label={t('fields.preferredGender')}
              value={tEnums(`gender_preference.${room.preferredGender}`)}
            />
          )}
          {room.preferredAgeMin != null && (
            <Row label={t('fields.preferredAgeMin')} value={String(room.preferredAgeMin)} />
          )}
          {room.preferredAgeMax != null && (
            <Row label={t('fields.preferredAgeMax')} value={String(room.preferredAgeMax)} />
          )}
        </Card>

        {!canPublish && (
          <Text className="text-destructive text-center text-sm">{t('status.publishError')}</Text>
        )}
      </ScrollView>

      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button onPress={handlePublish} disabled={publishRoom.isPending || !canPublish}>
          {publishRoom.isPending ? (
            <ActivityIndicator className="accent-primary-foreground" />
          ) : (
            <Text>{t('actions.publish')}</Text>
          )}
        </Button>
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
