import { MAX_PROFILE_PHOTOS } from '@openhospi/shared/constants';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';
import * as ImagePicker from 'expo-image-picker';
import { useImperativeHandle, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticFormSubmitError, hapticFormSubmitSuccess, hapticLight } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useUploadProfilePhoto } from '@/services/profile';

import type { StepHandle } from '@/components/shared/onboarding-types';

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
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.photoSlots' });
  const { t: tOnboarding } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const [slots, setSlots] = useState<PhotoSlot[]>(() => buildInitialSlots(profile));
  const uploadPhoto = useUploadProfilePhoto();

  const hasAtLeastOnePhoto = slots.some((s) => s?.uploaded);

  function handleSubmit() {
    if (!hasAtLeastOnePhoto) {
      hapticFormSubmitError();
      Alert.alert(tOnboarding('errors.minPhotos'));
      return;
    }
    onNext();
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  async function pickPhoto(slotIndex: number) {
    hapticLight();
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
          hapticFormSubmitSuccess();
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = { uri: asset.uri, uploading: false, uploaded: true };
            return next;
          });
        },
        onError: () => {
          hapticFormSubmitError();
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = null;
            return next;
          });
          Alert.alert(tErrors('uploadFailed'));
        },
      }
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.slotList}>
        {SLOT_KEYS.map((key, index) => {
          const photo = slots[index];
          return (
            <Pressable
              key={key}
              onPress={() => void pickPhoto(index)}
              disabled={photo?.uploading}
              accessibilityRole="button"
              accessibilityLabel={t(key)}
              accessibilityState={{ disabled: !!photo?.uploading, selected: !!photo?.uploaded }}>
              <GroupedSection style={styles.slotCard}>
                <View style={styles.slotRow}>
                  {photo?.uri ? (
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
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
                    {photo?.uploading && (
                      <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                        {tCommon('uploading')}
                      </ThemedText>
                    )}
                    {photo?.uploaded && (
                      <ThemedText variant="caption1" color={colors.primary}>
                        {tCommon('uploaded')}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </GroupedSection>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
    paddingBottom: 32,
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
    height: 64,
    width: 64,
    borderRadius: radius.md,
  },
  thumbnailPlaceholder: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  slotLabel: {
    flex: 1,
  },
});
