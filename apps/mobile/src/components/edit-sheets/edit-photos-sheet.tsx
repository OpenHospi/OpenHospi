import { MAX_PROFILE_PHOTOS } from '@openhospi/shared/constants';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useTranslations } from '@/i18n';
import { useDeleteProfilePhoto, useUploadProfilePhoto } from '@/services/profile';
import type { ProfilePhoto } from '@/services/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

type Props = {
  visible: boolean;
  onClose: () => void;
  photos: ProfilePhoto[];
};

export function EditPhotosSheet({ visible, onClose, photos }: Props) {
  const tCommon = useTranslations('common.labels');
  const t = useTranslations('app.onboarding.photoSlots');

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
      { onError: () => Alert.alert('Upload failed') },
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
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable onPress={onClose}>
            <Text className="text-base text-muted-foreground">{tCommon('close')}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Photos</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView className="flex-1 px-4 pt-4">
          {SLOT_KEYS.map((key, index) => {
            const slot = index + 1;
            const photo = photos.find((p) => p.slot === slot);
            const photoUrl = photo
              ? `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${photo.url}`
              : null;

            return (
              <View
                key={key}
                className="mb-3 flex-row items-center gap-3 rounded-xl border border-border p-3"
              >
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    className="h-16 w-16 rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-16 w-16 items-center justify-center rounded-lg bg-muted">
                    <Text className="text-2xl text-muted-foreground">+</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{t(key)}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    className="rounded-lg bg-primary/10 px-3 py-1.5"
                    onPress={() => handlePick(slot)}
                  >
                    <Text className="text-sm text-primary">
                      {photoUrl ? tCommon('edit') : 'Add'}
                    </Text>
                  </Pressable>
                  {photoUrl && (
                    <Pressable
                      className="rounded-lg bg-destructive/10 px-3 py-1.5"
                      onPress={() => handleDelete(slot)}
                    >
                      <Text className="text-sm text-destructive">{tCommon('delete')}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
