import { RoomStatus } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PhotoCarousel } from '@/components/rooms/photo-carousel';
import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { ListSeparator } from '@/components/layout/list-separator';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { useDeleteRoom, useMyRoom, useUpdateRoomStatus } from '@/services/my-rooms';
import type { BadgeVariant } from '@/components/native/badge';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RoomStatus.active]: 'primary',
  [RoomStatus.draft]: 'outline',
  [RoomStatus.paused]: 'secondary',
  [RoomStatus.closed]: 'destructive',
};

function SkeletonRoomDetail() {
  return (
    <View style={styles.skeletonContainer}>
      <ThemedSkeleton width="100%" height={280} />
      <View style={styles.contentPadding}>
        <View style={styles.skeletonTitleRow}>
          <ThemedSkeleton width="60%" height={22} />
          <ThemedSkeleton width={60} height={24} rounded="full" />
        </View>
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={120} rounded="lg" />
        <ThemedSkeleton width="100%" height={140} rounded="lg" />
        <ThemedSkeleton width="100%" height={80} rounded="lg" />
      </View>
    </View>
  );
}

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
    return <SkeletonRoomDetail />;
  }

  const status = room.status;

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}>
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

          {/* Pricing */}
          <GroupedSection inset={false}>
            <ListCell label={t('fields.rentPrice')} value={`€${room.rentPrice}`} />
            {room.deposit != null && (
              <>
                <ListSeparator />
                <ListCell label={t('fields.deposit')} value={`€${room.deposit}`} />
              </>
            )}
            {room.serviceCosts != null && (
              <>
                <ListSeparator />
                <ListCell label={t('fields.serviceCosts')} value={`€${room.serviceCosts}`} />
              </>
            )}
            <ListSeparator />
            <ListCell label={tCommon('total')} value={`€${room.totalCost}`} />
          </GroupedSection>

          {/* Property */}
          <GroupedSection inset={false}>
            {room.houseType && (
              <ListCell
                label={t('fields.houseType')}
                value={tEnums(`house_type.${room.houseType}`)}
              />
            )}
            {room.furnishing && (
              <>
                {room.houseType && <ListSeparator />}
                <ListCell
                  label={t('fields.furnishing')}
                  value={tEnums(`furnishing.${room.furnishing}`)}
                />
              </>
            )}
            {room.roomSizeM2 && (
              <>
                {(room.houseType || room.furnishing) && <ListSeparator />}
                <ListCell label={t('fields.roomSize')} value={`${room.roomSizeM2}m²`} />
              </>
            )}
            {room.rentalType && (
              <>
                <ListSeparator />
                <ListCell
                  label={t('fields.rentalType')}
                  value={tEnums(`rental_type.${room.rentalType}`)}
                />
              </>
            )}
            {room.totalHousemates != null && (
              <>
                <ListSeparator />
                <ListCell
                  label={t('fields.totalHousemates')}
                  value={String(room.totalHousemates)}
                />
              </>
            )}
          </GroupedSection>

          {/* Features */}
          {room.features.length > 0 && (
            <GroupedSection inset={false}>
              <View style={styles.chipSection}>
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
            <GroupedSection inset={false}>
              <View style={styles.chipSection}>
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

          {/* Management Navigation */}
          {status !== RoomStatus.draft && (
            <GroupedSection inset={false}>
              <ListCell
                label={t('manage.tabs.applicants')}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/manage-room/[id]/applicants',
                    params: { id },
                  })
                }
              />
              <ListSeparator />
              <ListCell
                label={t('events.title')}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/manage-room/[id]/events',
                    params: { id },
                  })
                }
              />
              <ListSeparator />
              <ListCell
                label={t('voting.title')}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/manage-room/[id]/voting',
                    params: { id },
                  })
                }
              />
            </GroupedSection>
          )}

          {/* Actions */}
          <GroupedSection inset={false}>
            <ListCell
              label={t('actions.edit')}
              onPress={() =>
                router.push({
                  pathname: '/(app)/manage-room/[id]/edit',
                  params: { id },
                })
              }
            />
            <ListSeparator />
            <ListCell
              label={t('shareLink.title')}
              onPress={() =>
                router.push({
                  pathname: '/(app)/manage-room/[id]/share-link',
                  params: { id },
                })
              }
            />
            {status === RoomStatus.draft && (
              <>
                <ListSeparator />
                <ListCell label={t('actions.deleteDraft')} destructive onPress={handleDelete} />
              </>
            )}
          </GroupedSection>
        </View>
      </ScrollView>

      {/* Bottom Status Action */}
      {status === RoomStatus.draft && (
        <BlurBottomBar>
          <NativeButton
            label={t('actions.publish')}
            onPress={() => handleStatusChange(RoomStatus.active)}
          />
        </BlurBottomBar>
      )}
      {status === RoomStatus.active && (
        <BlurBottomBar style={styles.bottomRow}>
          <View style={styles.flex1}>
            <NativeButton
              label={t('actions.pause')}
              variant="outline"
              onPress={() => handleStatusChange(RoomStatus.paused)}
            />
          </View>
          <View style={styles.flex1}>
            <NativeButton
              label={t('actions.close')}
              variant="destructive"
              onPress={() =>
                router.push({
                  pathname: '/(app)/manage-room/[id]/close-room',
                  params: { id },
                })
              }
            />
          </View>
        </BlurBottomBar>
      )}
      {status === RoomStatus.paused && (
        <BlurBottomBar style={styles.bottomRow}>
          <View style={styles.flex1}>
            <NativeButton
              label={t('actions.activate')}
              onPress={() => handleStatusChange(RoomStatus.active)}
            />
          </View>
          <View style={styles.flex1}>
            <NativeButton
              label={t('actions.close')}
              variant="destructive"
              onPress={() =>
                router.push({
                  pathname: '/(app)/manage-room/[id]/close-room',
                  params: { id },
                })
              }
            />
          </View>
        </BlurBottomBar>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
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
  chipSection: {
    padding: 16,
    gap: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bottomRow: {
    flexDirection: 'row',
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
