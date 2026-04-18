import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useDeleteRoomPhoto, useMyRoom, useUploadRoomPhoto } from '@/services/my-rooms';
import type { RoomDetailPhoto } from '@openhospi/shared/api-types';

const MAX_SLOTS = 10;

export default function PhotosScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
      await uploadPhoto.mutateAsync({ roomId, uri: result.assets[0].uri, slot });
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
    router.push({ pathname: '/(app)/manage-room/create/review', params: { roomId } });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedSkeleton width="60%" height={20} />
        <ThemedSkeleton width="80%" height={14} />
        <View style={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={styles.slotWrapper}>
              <ThemedSkeleton width="100%" height={120} rounded="lg" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        <ThemedText variant="headline">{t('wizard.steps.photos')}</ThemedText>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('wizard.photoGuidance')}
        </ThemedText>
        <ThemedText variant="caption1" color={colors.tertiaryForeground}>
          {t('wizard.photoCount', { count: photos.length, max: MAX_SLOTS })}
        </ThemedText>

        <View style={styles.grid}>
          {Array.from({ length: MAX_SLOTS }, (_, i) => i + 1).map((slot) => {
            const photo = photoMap.get(slot);
            return (
              <PhotoSlot
                key={slot}
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

      <BlurBottomBar>
        <NativeButton label={tCommon('next')} onPress={handleNext} />
      </BlurBottomBar>
    </View>
  );
}

function PhotoSlot({
  photo,
  slotLabel,
  onPick,
  onDelete,
  isUploading,
}: {
  photo: RoomDetailPhoto | undefined;
  slotLabel: string;
  onPick: () => void;
  onDelete: () => void;
  isUploading: boolean;
}) {
  const { colors } = useTheme();
  const photoUrl = photo ? getStoragePublicUrl(photo.url, 'room-photos') : null;

  return (
    <View style={styles.slotWrapper}>
      {photoUrl ? (
        <Pressable onPress={onDelete} style={styles.slotFill}>
          <Image
            source={{ uri: photoUrl }}
            style={[styles.slotFill, { borderRadius: radius.lg }]}
            contentFit="cover"
          />
          <View style={[styles.deleteButton, { backgroundColor: colors.destructive }]}>
            <NativeIcon name="trash" size={14} color={colors.primaryForeground} />
          </View>
          <View style={styles.slotLabelOverlay}>
            <ThemedText variant="caption2" color={colors.primaryForeground}>
              {slotLabel}
            </ThemedText>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPick}
          disabled={isUploading}
          style={[
            styles.emptySlot,
            {
              backgroundColor: colors.muted,
              borderRadius: radius.lg,
            },
          ]}>
          <NativeIcon name="camera" size={20} color={colors.tertiaryForeground} />
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {slotLabel}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, padding: 16, gap: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotWrapper: { width: '48%', aspectRatio: 4 / 3 },
  slotFill: { flex: 1, position: 'relative' },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
