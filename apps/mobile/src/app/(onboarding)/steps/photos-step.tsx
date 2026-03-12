import { MAX_PROFILE_PHOTOS } from '@openhospi/shared/constants';
import * as ImagePicker from 'expo-image-picker';
import { useImperativeHandle, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useUploadProfilePhoto } from '@/services/profile';
import type { ProfileWithPhotos } from '@/services/types';

import type { StepHandle } from '../types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

type PhotoSlot = { uri: string; uploading: boolean; uploaded: boolean } | null;

const SLOT_KEYS = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'] as const;

function buildInitialSlots(profile: ProfileWithPhotos | undefined): PhotoSlot[] {
  const slots: PhotoSlot[] = Array(MAX_PROFILE_PHOTOS).fill(null);
  if (!profile?.photos) return slots;

  for (const photo of profile.photos) {
    const index = photo.slot - 1;
    if (index >= 0 && index < MAX_PROFILE_PHOTOS) {
      slots[index] = {
        uri: getStoragePublicUrl(photo.url, 'profile-photos'),
        uploading: false,
        uploaded: true,
      };
    }
  }
  return slots;
}

export default function PhotosStep({ ref, onNext, profile }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.photoSlots' });

  const [slots, setSlots] = useState<PhotoSlot[]>(() => buildInitialSlots(profile));
  const uploadPhoto = useUploadProfilePhoto();

  const hasAtLeastOnePhoto = slots.some((s) => s?.uploaded);

  function handleSubmit() {
    if (!hasAtLeastOnePhoto) {
      Alert.alert('Please upload at least one photo.');
      return;
    }
    onNext();
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
      <View style={{ gap: 12 }}>
        {SLOT_KEYS.map((key, index) => {
          const photo = slots[index];
          return (
            <Pressable key={key} onPress={() => pickPhoto(index)} disabled={photo?.uploading}>
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  paddingVertical: 12,
                }}>
                {photo?.uri ? (
                  <Image
                    source={{ uri: photo.uri }}
                    style={{ height: 64, width: 64, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      height: 64,
                      width: 64,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                    }}
                    className="bg-muted">
                    <Text variant="muted" className="text-2xl">
                      +
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text className="text-card-foreground text-sm font-medium">{t(key)}</Text>
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
    </ScrollView>
  );
}
