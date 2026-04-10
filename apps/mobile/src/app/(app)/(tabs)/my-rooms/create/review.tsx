import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListSeparator } from '@/components/layout/list-separator';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useMyRoom, usePublishRoom } from '@/services/my-rooms';

export default function ReviewScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const photos = room.photos ?? [];
  const canPublish = photos.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {photos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}>
            {photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: getStoragePublicUrl(photo.url, 'room-photos') }}
                style={styles.photoPreview}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        )}

        <GroupedSection>
          <View style={styles.sectionContent}>
            <ThemedText variant="headline">{room.title || tEnums('room_status.draft')}</ThemedText>
            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {tEnums(`city.${room.city}`)}
              {room.neighborhood ? ` - ${room.neighborhood}` : ''}
            </ThemedText>
            {room.description && (
              <ThemedText variant="body" color={colors.secondaryForeground}>
                {room.description}
              </ThemedText>
            )}
          </View>
        </GroupedSection>

        <GroupedSection>
          <View style={styles.sectionContent}>
            <ThemedText variant="headline">{t('wizard.sections.pricing')}</ThemedText>
            <Row label={t('fields.rentPrice')} value={`€${room.rentPrice}`} />
            {room.deposit != null && <Row label={t('fields.deposit')} value={`€${room.deposit}`} />}
            {room.serviceCosts != null && (
              <Row label={t('fields.serviceCosts')} value={`€${room.serviceCosts}`} />
            )}
            <ListSeparator insetLeft={0} />
            <Row label={tCommon('total')} value={`€${room.totalCost}`} bold />
          </View>
        </GroupedSection>

        <GroupedSection>
          <View style={styles.sectionContent}>
            <ThemedText variant="headline">{t('wizard.sections.property')}</ThemedText>
            {room.houseType && (
              <Row label={t('fields.houseType')} value={tEnums(`house_type.${room.houseType}`)} />
            )}
            {room.furnishing && (
              <Row label={t('fields.furnishing')} value={tEnums(`furnishing.${room.furnishing}`)} />
            )}
            {room.roomSizeM2 && <Row label={t('fields.roomSize')} value={`${room.roomSizeM2}m²`} />}
            {room.rentalType && (
              <Row
                label={t('fields.rentalType')}
                value={tEnums(`rental_type.${room.rentalType}`)}
              />
            )}
            {room.totalHousemates != null && (
              <Row label={t('fields.totalHousemates')} value={String(room.totalHousemates)} />
            )}
          </View>
        </GroupedSection>

        {room.features.length > 0 && (
          <GroupedSection>
            <View style={styles.sectionContent}>
              <ThemedText variant="headline">{t('fields.features')}</ThemedText>
              <View style={styles.tagWrap}>
                {room.features.map((f) => (
                  <ThemedBadge key={f} variant="secondary" label={tEnums(`room_feature.${f}`)} />
                ))}
              </View>
            </View>
          </GroupedSection>
        )}

        {room.locationTags.length > 0 && (
          <GroupedSection>
            <View style={styles.sectionContent}>
              <ThemedText variant="headline">{t('fields.locationTags')}</ThemedText>
              <View style={styles.tagWrap}>
                {room.locationTags.map((tag) => (
                  <ThemedBadge
                    key={tag}
                    variant="secondary"
                    label={tEnums(`location_tag.${tag}`)}
                  />
                ))}
              </View>
            </View>
          </GroupedSection>
        )}

        <GroupedSection>
          <View style={styles.sectionContent}>
            <ThemedText variant="headline">{t('wizard.sections.preferences')}</ThemedText>
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
          </View>
        </GroupedSection>

        {!canPublish && (
          <ThemedText variant="footnote" color={colors.destructive} style={styles.errorText}>
            {t('status.publishError')}
          </ThemedText>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.separator, paddingBottom: Math.max(bottom, 16) },
        ]}>
        <ThemedButton
          onPress={handlePublish}
          loading={publishRoom.isPending}
          disabled={!canPublish}>
          {t('actions.publish')}
        </ThemedButton>
      </View>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={rowStyles.row}>
      <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
        {label}
      </ThemedText>
      <ThemedText variant={bold ? 'headline' : 'subheadline'}>{value}</ThemedText>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  photoRow: { gap: 8 },
  photoPreview: { width: 200, aspectRatio: 4 / 3, borderRadius: 12 },
  sectionContent: { padding: 16, gap: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  errorText: { textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
