import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useDeleteRoomPhoto, useMyRoom, useUploadRoomPhoto } from '@/services/my-rooms';
import type { RoomDetailPhoto } from '@openhospi/shared/api-types';

const MAX_SLOTS = 10;

export default function PhotosScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(roomId);
  const uploadPhoto = useUploadRoomPhoto();
  const deletePhoto = useDeleteRoomPhoto();

  const photos = room?.photos ?? [];
  const photoMap = new Map(photos.map((p) => [p.slot, p]));

  const handlePickPhoto = async (slot: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      await uploadPhoto.mutateAsync({
        roomId,
        uri: result.assets[0].uri,
        slot,
      });
    } catch {
      Alert.alert(t('status.createFailed'));
    }
  };

  const handleDeletePhoto = (slot: number) => {
    Alert.alert(tCommon('delete'), t('status.confirmDelete'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('delete'),
        style: 'destructive',
        onPress: () => deletePhoto.mutate({ roomId, slot }),
      },
    ]);
  };

  const handleNext = () => {
    router.push({ pathname: '/(app)/(tabs)/my-rooms/create/review', params: { roomId } });
  };

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        <Text className="text-foreground text-lg font-semibold">{t('wizard.steps.photos')}</Text>
        <Text variant="muted" className="text-sm">
          {t('wizard.photoGuidance')}
        </Text>
        <Text variant="muted" className="text-xs">
          {t('wizard.photoCount', { count: photos.length, max: MAX_SLOTS })}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
          }}>
          {Array.from({ length: MAX_SLOTS }, (_, i) => i + 1).map((slot) => {
            const photo = photoMap.get(slot);
            return (
              <PhotoSlot
                key={slot}
                slot={slot}
                photo={photo}
                slotLabel={t(`photoSlots.slot${slot}` as never)}
                onPick={() => handlePickPhoto(slot)}
                onDelete={() => handleDeletePhoto(slot)}
                isUploading={uploadPhoto.isPending}
              />
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button onPress={handleNext}>
          <Text>{tCommon('next')}</Text>
        </Button>
      </View>
    </View>
  );
}

function PhotoSlot({
  slot,
  photo,
  slotLabel,
  onPick,
  onDelete,
  isUploading,
}: {
  slot: number;
  photo: RoomDetailPhoto | undefined;
  slotLabel: string;
  onPick: () => void;
  onDelete: () => void;
  isUploading: boolean;
}) {
  const photoUrl = photo ? getStoragePublicUrl(photo.url, 'room-photos') : null;

  return (
    <View style={{ width: '48%', aspectRatio: 4 / 3 }}>
      {photoUrl ? (
        <Pressable onPress={onDelete} style={{ flex: 1, position: 'relative' }}>
          <Image
            source={{ uri: photoUrl }}
            style={{ flex: 1, borderRadius: 12 }}
            contentFit="cover"
          />
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="bg-destructive">
            <Trash2 size={14} color="white" />
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
            }}
            className="bg-black/50">
            <Text className="text-xs text-white">{slotLabel}</Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPick}
          disabled={isUploading}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            gap: 4,
          }}
          className="border-muted-foreground/30 bg-muted/50">
          <Camera size={20} className="text-muted-foreground" />
          <Text variant="muted" className="text-xs">
            {slotLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
