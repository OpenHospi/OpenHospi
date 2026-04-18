import { STORAGE_BUCKET_ROOM_PHOTOS } from '@openhospi/shared/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { NativeDivider } from '@/components/native/divider';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { PhotoCarousel } from '@/components/rooms/photo-carousel';
import RoomLocationMap from '@/components/rooms/room-location-map';
import { useTheme, type Colors } from '@/design';
import { radius } from '@/design/tokens/radius';
import { useRoom } from '@/services/rooms';

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | null | undefined;
  colors: Colors;
}) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
        {label}
      </ThemedText>
      <ThemedText variant="subheadline">{value}</ThemedText>
    </View>
  );
}

function PriceValue({ amount, colors }: { amount: string | number; colors: Colors }) {
  return (
    <View style={styles.priceValue}>
      <NativeIcon name="eurosign" androidName="euro-symbol" size={12} color={colors.foreground} />
      <ThemedText variant="subheadline">{amount}</ThemedText>
    </View>
  );
}

function PriceDetailRow({
  label,
  amount,
  colors,
}: {
  label: string;
  amount: string | number | null | undefined;
  colors: Colors;
}) {
  if (!amount) return null;
  return (
    <View style={styles.detailRow}>
      <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
        {label}
      </ThemedText>
      <PriceValue amount={amount} colors={colors} />
    </View>
  );
}

function LoadingState() {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentInsetAdjustmentBehavior="automatic">
        <ThemedSkeleton width="100%" height={300} rounded="sm" />
        <View style={[styles.content, { gap: spacing['2xl'], paddingHorizontal: spacing.lg }]}>
          <ThemedSkeleton width="70%" height={28} />
          <ThemedSkeleton width="50%" height={18} />
          <ThemedSkeleton width="100%" height={180} rounded="lg" />
          <ThemedSkeleton width="100%" height={220} rounded="lg" />
          <ThemedSkeleton width="100%" height={160} rounded="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.roomDetail' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tRoomFields } = useTranslation('translation', { keyPrefix: 'app.rooms.fields' });
  const { colors, spacing } = useTheme();

  const insets = useSafeAreaInsets();
  const { data, isPending } = useRoom(id);

  if (isPending) {
    return <LoadingState />;
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText variant="body" color={colors.tertiaryForeground}>
          {t('notFound')}
        </ThemedText>
        <NativeButton
          label={t('backToDiscover')}
          variant="link"
          style={{ marginTop: spacing.lg }}
          onPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const { room, application } = data;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.flex}>
        <PhotoCarousel photos={room.photos} bucket={STORAGE_BUCKET_ROOM_PHOTOS} />

        <View
          style={[
            styles.content,
            { gap: spacing['2xl'], paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
          ]}>
          <View>
            <ThemedText variant="title2" accessibilityRole="header">
              {room.title}
            </ThemedText>
            <View style={[styles.locationRow, { gap: 6 }]}>
              <ThemedText variant="body" color={colors.tertiaryForeground}>
                {tEnums(`city.${room.city}`)}
              </ThemedText>
              {room.neighborhood ? (
                <>
                  <NativeIcon
                    name="circle.fill"
                    iosName="circle.fill"
                    androidName="fiber-manual-record"
                    size={4}
                    color={colors.mutedForeground}
                  />
                  <ThemedText variant="body" color={colors.tertiaryForeground}>
                    {room.neighborhood}
                  </ThemedText>
                </>
              ) : null}
            </View>
          </View>

          <GroupedSection inset={false}>
            <View style={styles.sectionPadding}>
              <PriceDetailRow label={t('rent')} amount={room.rentPrice} colors={colors} />
              <PriceDetailRow
                label={t('serviceCosts')}
                amount={room.serviceCosts}
                colors={colors}
              />
              <DetailRow
                label={t('utilitiesIncluded')}
                value={
                  room.utilitiesIncluded
                    ? tEnums(`utilities_included.${room.utilitiesIncluded}`)
                    : null
                }
                colors={colors}
              />
              <PriceDetailRow label={t('deposit')} amount={room.deposit} colors={colors} />
              <NativeDivider />
              <View style={styles.totalRow}>
                <ThemedText variant="body" weight="600">
                  {t('totalCost')}
                </ThemedText>
                <View style={styles.priceValue}>
                  <NativeIcon
                    name="eurosign"
                    androidName="euro-symbol"
                    size={18}
                    color={colors.primary}
                  />
                  <ThemedText variant="headline" color={colors.primary}>
                    {room.totalCost}
                    {tCommon('perMonth')}
                  </ThemedText>
                </View>
              </View>
            </View>
          </GroupedSection>

          <GroupedSection inset={false} header={t('details')}>
            <View style={styles.sectionPadding}>
              <DetailRow
                label={tRoomFields('roomSize')}
                value={room.roomSizeM2 ? t('roomSize', { size: String(room.roomSizeM2) }) : null}
                colors={colors}
              />
              <DetailRow
                label={tEnums('house_type._label')}
                value={room.houseType ? tEnums(`house_type.${room.houseType}`) : null}
                colors={colors}
              />
              <DetailRow
                label={tEnums('furnishing_label')}
                value={room.furnishing ? tEnums(`furnishing.${room.furnishing}`) : null}
                colors={colors}
              />
              <DetailRow
                label={t('rentalType')}
                value={room.rentalType ? tEnums(`rental_type.${room.rentalType}`) : null}
                colors={colors}
              />
              {room.availableFrom ? (
                <DetailRow
                  label={t('availability')}
                  value={
                    t('availableFrom', { date: room.availableFrom }) +
                    (room.availableUntil
                      ? ` · ${t('availableUntil', { date: room.availableUntil })}`
                      : '')
                  }
                  colors={colors}
                />
              ) : null}
              {room.totalHousemates != null ? (
                <DetailRow
                  label={tRoomFields('totalHousemates')}
                  value={tCommon('housemates', { count: Number(room.totalHousemates) })}
                  colors={colors}
                />
              ) : null}
            </View>
          </GroupedSection>

          {room.features.length > 0 ? (
            <View>
              <ThemedText variant="body" weight="600">
                {t('features')}
              </ThemedText>
              <View style={[styles.chipRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
                {room.features.map((f) => (
                  <ThemedBadge
                    key={f}
                    variant="secondary"
                    label={tEnums(`room_feature.${f}`)}
                    style={styles.featureBadge}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {room.locationTags.length > 0 ? (
            <View>
              <ThemedText variant="body" weight="600">
                {t('locationTags')}
              </ThemedText>
              <View style={[styles.chipRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
                {room.locationTags.map((tag) => (
                  <ThemedBadge
                    key={tag}
                    variant="outline"
                    label={tEnums(`location_tag.${tag}`)}
                    style={styles.featureBadge}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {room.latitude != null && room.longitude != null ? (
            <View>
              <ThemedText variant="body" weight="600">
                {t('location')}
              </ThemedText>
              <View style={{ marginTop: spacing.sm }}>
                <RoomLocationMap latitude={room.latitude} longitude={room.longitude} />
              </View>
              <ThemedText
                variant="caption1"
                color={colors.mutedForeground}
                style={{ marginTop: spacing.sm }}>
                {t('approximateLocation')}
              </ThemedText>
            </View>
          ) : null}

          <GroupedSection inset={false} header={t('whoWereLookingFor')}>
            <View style={styles.sectionPadding}>
              {room.preferredGender && room.preferredGender !== 'no_preference' ? (
                <DetailRow
                  label={tEnums('gender._label')}
                  value={tEnums(`gender.${room.preferredGender}`)}
                  colors={colors}
                />
              ) : (
                <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                  {t('everyoneWelcome')}
                </ThemedText>
              )}
              {room.preferredAgeMin || room.preferredAgeMax ? (
                <DetailRow
                  label={t('ageRange')}
                  value={`${room.preferredAgeMin ?? '?'} - ${room.preferredAgeMax ?? '?'}`}
                  colors={colors}
                />
              ) : null}
              {room.acceptedLanguages.length > 0 ? (
                <DetailRow
                  label={t('acceptedLanguages')}
                  value={room.acceptedLanguages.map((l) => tEnums(`language_enum.${l}`)).join(', ')}
                  colors={colors}
                />
              ) : null}
            </View>
          </GroupedSection>

          {room.description ? (
            <View>
              <ThemedText variant="body" weight="600">
                {t('description')}
              </ThemedText>
              <ThemedText variant="subheadline" style={{ marginTop: spacing.sm, lineHeight: 20 }}>
                {room.description}
              </ThemedText>
            </View>
          ) : null}

          {room.owner ? (
            <GroupedSection inset={false}>
              <View style={styles.sectionPadding}>
                <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                  {t('postedBy')}
                </ThemedText>
                <ThemedText variant="body" weight="500" style={{ marginTop: 4 }}>
                  {room.owner.firstName} {room.owner.lastName}
                </ThemedText>
                {room.owner.studyProgram ? (
                  <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                    {room.owner.studyProgram}
                  </ThemedText>
                ) : null}
              </View>
            </GroupedSection>
          ) : null}

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}>
        {application ? (
          <NativeButton
            label={t('viewApplication')}
            variant="outline"
            systemImage="doc.text"
            materialIcon="description"
            style={styles.bottomButton}
            onPress={() =>
              router.push({
                pathname: '/(app)/application/[id]',
                params: { id: application.id },
              })
            }
            accessibilityHint={t('viewApplication')}
          />
        ) : (
          <NativeButton
            label={t('apply')}
            systemImage="paperplane.fill"
            materialIcon="send"
            style={styles.bottomButton}
            onPress={() =>
              router.push({
                pathname: '/(app)/(modals)/apply-sheet',
                params: { roomId: id },
              })
            }
            accessibilityHint={room.title}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {},
  locationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionPadding: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureBadge: {
    borderRadius: radius.md,
  },
  bottomBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomButton: {
    height: 48,
    borderRadius: radius.xl,
  },
});
