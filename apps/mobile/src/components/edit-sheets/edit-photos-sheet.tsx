import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Alert, Modal, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useDeleteProfilePhoto, useUploadProfilePhoto } from '@/services/profile';
import type { ProfilePhoto } from '@/services/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

type Props = {
  visible: boolean;
  onClose: () => void;
  photos: ProfilePhoto[];
};

export function EditPhotosSheet({ visible, onClose, photos }: Props) {
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.photoSlots' });

  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();

  const SLOT_KEYS = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'] as const;

  async function handlePick(slot: number) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    uploadPhoto.mutate(
      {
        file: {
          uri: asset.uri,
          name: asset.fileName ?? `photo-${slot}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        },
        slot,
      },
      { onError: () => Alert.alert('Upload failed') }
    );
  }

  function handleDelete(slot: number) {
    Alert.alert('Delete photo?', '', [
      { text: tCommon('cancel'), style: 'cancel' },
      { text: tCommon('delete'), style: 'destructive', onPress: () => deletePhoto.mutate(slot) },
    ]);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="bg-background flex-1">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Button variant="ghost" onPress={onClose}>
            <Text>{tCommon('close')}</Text>
          </Button>
          <Text className="font-semibold">Photos</Text>
          <View style={{ width: 50 }} />
        </View>
        <Separator />

        <ScrollView className="flex-1 px-4 pt-4">
          {SLOT_KEYS.map((key, index) => {
            const slot = index + 1;
            const photo = photos.find((p) => p.slot === slot);
            const photoUrl = photo
              ? `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${photo.url}`
              : null;

            return (
              <Card key={key} className="mb-3">
                <CardContent className="flex-row items-center gap-3">
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={{ width: 64, height: 64, borderRadius: 8 }}
                      contentFit="cover"
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
                  </View>
                  <View className="flex-row gap-2">
                    <Button variant="outline" size="sm" onPress={() => handlePick(slot)}>
                      <Text>{photoUrl ? tCommon('edit') : 'Add'}</Text>
                    </Button>
                    {photoUrl && (
                      <Button variant="destructive" size="sm" onPress={() => handleDelete(slot)}>
                        <Text>{tCommon('delete')}</Text>
                      </Button>
                    )}
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
