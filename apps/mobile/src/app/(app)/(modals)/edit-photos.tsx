import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useDeleteProfilePhoto, useProfile, useUploadProfilePhoto } from '@/services/profile';
import { useTranslation } from 'react-i18next';

const SLOT_KEYS = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'] as const;

export default function EditPhotosScreen() {
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.photoSlots' });

  const { data: profile, isPending } = useProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();

  if (isPending || !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.slotList}>
        {SLOT_KEYS.map((key, index) => {
          const slot = index + 1;
          const photo = photos.find((p) => p.slot === slot);
          const photoUrl = photo ? getStoragePublicUrl(photo.url, 'profile-photos') : null;

          return (
            <GroupedSection key={key} style={styles.slotCard}>
              <View style={styles.slotRow}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.thumbnail} contentFit="cover" />
                ) : (
                  <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.muted }]}>
                    <ThemedText variant="title2" color={colors.tertiaryForeground}>
                      +
                    </ThemedText>
                  </View>
                )}
                <View style={styles.slotLabel}>
                  <ThemedText variant="subheadline" weight="500">
                    {t(key)}
                  </ThemedText>
                </View>
                <View style={styles.slotActions}>
                  <ThemedButton variant="outline" size="sm" onPress={() => handlePick(slot)}>
                    {photoUrl ? tCommon('edit') : 'Add'}
                  </ThemedButton>
                  {photoUrl && (
                    <ThemedButton
                      variant="destructive"
                      size="sm"
                      onPress={() => handleDelete(slot)}>
                      {tCommon('delete')}
                    </ThemedButton>
                  )}
                </View>
              </View>
            </GroupedSection>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotList: {
    gap: 12,
  },
  slotCard: {
    marginHorizontal: 0,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  slotLabel: {
    flex: 1,
  },
  slotActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
