import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useDeleteProfilePhoto, useProfile, useUploadProfilePhoto } from '@/services/profile';
const SLOT_KEYS = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'] as const;

export default function EditPhotosScreen() {
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.photoSlots' });

  const { data: profile, isPending } = useProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();

  if (isPending || !profile) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const { photos } = profile;

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
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} className="bg-background">
      <View style={{ gap: 12 }}>
        {SLOT_KEYS.map((key, index) => {
          const slot = index + 1;
          const photo = photos.find((p) => p.slot === slot);
          const photoUrl = photo ? getStoragePublicUrl(photo.url, 'profile-photos') : null;

          return (
            <Card key={key}>
              <CardContent style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={{ width: 64, height: 64, borderRadius: 8 }}
                    contentFit="cover"
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
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
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
      </View>
    </View>
  );
}
