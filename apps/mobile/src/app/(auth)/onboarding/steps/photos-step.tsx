import { MAX_PROFILE_PHOTOS } from '@openhospi/shared/constants';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useUploadProfilePhoto } from '@/services/profile';

type Props = { onNext: () => void };

type PhotoSlot = { uri: string; uploading: boolean; uploaded: boolean } | null;

const SLOT_KEYS = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'] as const;

export default function PhotosStep({ onNext }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.photoSlots' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [slots, setSlots] = useState<PhotoSlot[]>(Array(MAX_PROFILE_PHOTOS).fill(null));
  const uploadPhoto = useUploadProfilePhoto();

  const hasAtLeastOnePhoto = slots.some((s) => s?.uploaded);

  async function pickPhoto(slotIndex: number) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const slot = slotIndex + 1;
    const fileName = asset.fileName ?? `photo-${slot}.jpg`;
    const fileType = asset.mimeType ?? 'image/jpeg';

    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { uri: asset.uri, uploading: true, uploaded: false };
      return next;
    });

    uploadPhoto.mutate(
      {
        file: { uri: asset.uri, name: fileName, type: fileType },
        slot,
      },
      {
        onSuccess: () => {
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = { uri: asset.uri, uploading: false, uploaded: true };
            return next;
          });
        },
        onError: () => {
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = null;
            return next;
          });
          Alert.alert('Upload failed. Please try again.');
        },
      }
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="space-y-4 pb-8">
      <View className="gap-3">
        {SLOT_KEYS.map((key, index) => {
          const photo = slots[index];
          return (
            <Pressable key={key} onPress={() => pickPhoto(index)} disabled={photo?.uploading}>
              <Card className="flex-row items-center gap-3 p-3">
                {photo?.uri ? (
                  <Image
                    source={{ uri: photo.uri }}
                    className="h-16 w-16 rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="bg-muted h-16 w-16 items-center justify-center rounded-lg">
                    <Text variant="muted" className="text-2xl">
                      +
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-medium">{t(key)}</Text>
                  {photo?.uploading && (
                    <Text variant="muted" className="text-xs">
                      Uploading...
                    </Text>
                  )}
                  {photo?.uploaded && <Text className="text-primary text-xs">Uploaded</Text>}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={onNext} disabled={!hasAtLeastOnePhoto}>
        <Text>{tCommon('next')}</Text>
      </Button>
    </ScrollView>
  );
}
