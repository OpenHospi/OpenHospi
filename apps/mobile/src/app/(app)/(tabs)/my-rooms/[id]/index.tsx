import { RoomStatus } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PhotoCarousel } from '@/components/rooms/photo-carousel';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { useTheme } from '@/design';
import { useDeleteRoom, useMyRoom, useUpdateRoomStatus } from '@/services/my-rooms';
import type { BadgeVariant } from '@/components/primitives/themed-badge';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RoomStatus.active]: 'primary',
  [RoomStatus.draft]: 'outline',
  [RoomStatus.paused]: 'secondary',
  [RoomStatus.closed]: 'destructive',
};

export default function MyRoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

  const { data: room, isLoading } = useMyRoom(id);
  const updateStatus = useUpdateRoomStatus();
  const deleteRoom = useDeleteRoom();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === RoomStatus.closed) {
      Alert.alert(t('status.confirmCloseTitle'), t('status.confirmClose'), [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: tCommon('confirm'),
          style: 'destructive',
          onPress: () => updateStatus.mutate({ roomId: id, status: newStatus }),
        },
      ]);
    } else {
      updateStatus.mutate({ roomId: id, status: newStatus });
    }
  };

  const handleDelete = () => {
    Alert.alert(t('status.confirmDeleteTitle'), t('status.confirmDelete'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteRoom.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading || !room) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const status = room.status;

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
        {/* Photos */}
        <PhotoCarousel photos={room.photos} bucket="room-photos" />

        <View style={styles.contentPadding}>
          {/* Title + Status */}
          <View style={styles.titleRow}>
            <ThemedText variant="title3" style={styles.flex1}>
              {room.title || tEnums('room_status.draft')}
            </ThemedText>
            <ThemedBadge
              variant={STATUS_BADGE_VARIANT[status] ?? 'outline'}
              label={tEnums(`room_status.${status}`)}
            />
          </View>

          {/* Location */}
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {tEnums(`city.${room.city}`)}
            {room.neighborhood ? ` - ${room.neighborhood}` : ''}
          </ThemedText>

          {room.description && <ThemedText variant="subheadline">{room.description}</ThemedText>}

          {/* Pricing Card */}
          <GroupedSection style={styles.cardGap}>
            <View style={styles.cardInner}>
              <ThemedText variant="body" weight="600">
                {t('wizard.sections.pricing')}
              </ThemedText>
              <Row label={t('fields.rentPrice')} value={`€${room.rentPrice}`} colors={colors} />
              {room.deposit != null && (
                <Row label={t('fields.deposit')} value={`€${room.deposit}`} colors={colors} />
              )}
              {room.serviceCosts != null && (
                <Row
                  label={t('fields.serviceCosts')}
                  value={`€${room.serviceCosts}`}
                  colors={colors}
                />
              )}
              <Row label={tCommon('total')} value={`€${room.totalCost}`} bold colors={colors} />
            </View>
          </GroupedSection>

          {/* Property Card */}
          <GroupedSection style={styles.cardGap}>
            <View style={styles.cardInner}>
              <ThemedText variant="body" weight="600">
                {t('wizard.sections.property')}
              </ThemedText>
              {room.houseType && (
                <Row
                  label={t('fields.houseType')}
                  value={tEnums(`house_type.${room.houseType}`)}
                  colors={colors}
                />
              )}
              {room.furnishing && (
                <Row
                  label={t('fields.furnishing')}
                  value={tEnums(`furnishing.${room.furnishing}`)}
                  colors={colors}
                />
              )}
              {room.roomSizeM2 && (
                <Row label={t('fields.roomSize')} value={`${room.roomSizeM2}m²`} colors={colors} />
              )}
              {room.rentalType && (
                <Row
                  label={t('fields.rentalType')}
                  value={tEnums(`rental_type.${room.rentalType}`)}
                  colors={colors}
                />
              )}
              {room.totalHousemates != null && (
                <Row
                  label={t('fields.totalHousemates')}
                  value={String(room.totalHousemates)}
                  colors={colors}
                />
              )}
            </View>
          </GroupedSection>

          {/* Features */}
          {room.features.length > 0 && (
            <GroupedSection style={styles.cardGap}>
              <View style={styles.cardInner}>
                <ThemedText variant="body" weight="600">
                  {t('fields.features')}
                </ThemedText>
                <View style={styles.chipWrap}>
                  {room.features.map((f) => (
                    <ThemedBadge key={f} variant="secondary" label={tEnums(`room_feature.${f}`)} />
                  ))}
                </View>
              </View>
            </GroupedSection>
          )}

          {/* Location Tags */}
          {room.locationTags.length > 0 && (
            <GroupedSection style={styles.cardGap}>
              <View style={styles.cardInner}>
                <ThemedText variant="body" weight="600">
                  {t('fields.locationTags')}
                </ThemedText>
                <View style={styles.chipWrap}>
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

          {/* Management Buttons */}
          {status !== RoomStatus.draft && (
            <View style={styles.buttonGroup}>
              <ThemedButton
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/my-rooms/[id]/applicants',
                    params: { id },
                  })
                }>
                {t('manage.tabs.applicants')}
              </ThemedButton>

              <ThemedButton
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/my-rooms/[id]/events',
                    params: { id },
                  })
                }>
                {t('events.title')}
              </ThemedButton>

              <ThemedButton
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/my-rooms/[id]/voting',
                    params: { id },
                  })
                }>
                {t('voting.title')}
              </ThemedButton>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <ThemedButton
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/my-rooms/[id]/edit',
                  params: { id },
                })
              }>
              {t('actions.edit')}
            </ThemedButton>

            <ThemedButton
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/my-rooms/[id]/share-link',
                  params: { id },
                })
              }>
              {t('shareLink.title')}
            </ThemedButton>

            {status === RoomStatus.draft && (
              <ThemedButton variant="destructive" onPress={handleDelete}>
                {t('actions.deleteDraft')}
              </ThemedButton>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Status Action */}
      <View
        style={[
          styles.bottomBar,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}>
        {status === RoomStatus.draft && (
          <ThemedButton onPress={() => handleStatusChange(RoomStatus.active)}>
            {t('actions.publish')}
          </ThemedButton>
        )}
        {status === RoomStatus.active && (
          <View style={styles.bottomRow}>
            <View style={styles.flex1}>
              <ThemedButton variant="outline" onPress={() => handleStatusChange(RoomStatus.paused)}>
                {t('actions.pause')}
              </ThemedButton>
            </View>
            <View style={styles.flex1}>
              <ThemedButton
                variant="destructive"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/my-rooms/[id]/close-room',
                    params: { id },
                  })
                }>
                {t('actions.close')}
              </ThemedButton>
            </View>
          </View>
        )}
        {status === RoomStatus.paused && (
          <View style={styles.bottomRow}>
            <View style={styles.flex1}>
              <ThemedButton onPress={() => handleStatusChange(RoomStatus.active)}>
                {t('actions.activate')}
              </ThemedButton>
            </View>
            <View style={styles.flex1}>
              <ThemedButton
                variant="destructive"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/my-rooms/[id]/close-room',
                    params: { id },
                  })
                }>
                {t('actions.close')}
              </ThemedButton>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  bold,
  colors,
}: {
  label: string;
  value: string;
  bold?: boolean;
  colors: { tertiaryForeground: string; foreground: string };
}) {
  return (
    <View style={styles.row}>
      <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
        {label}
      </ThemedText>
      <ThemedText variant={bold ? 'body' : 'subheadline'} weight={bold ? 'bold' : undefined}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentPadding: {
    padding: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardGap: {
    marginHorizontal: 0,
  },
  cardInner: {
    padding: 16,
    gap: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  buttonGroup: {
    gap: 8,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
