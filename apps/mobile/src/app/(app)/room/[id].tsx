import { STORAGE_BUCKET_ROOM_PHOTOS } from '@openhospi/shared/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dot, Euro } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListSeparator } from '@/components/layout/list-separator';
import { PhotoCarousel } from '@/components/photo-carousel';
import RoomLocationMap from '@/components/room-location-map';
import { useTranslation } from 'react-i18next';
import { useRoom } from '@/services/rooms';

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | null | undefined;
  colors: ReturnType<typeof useTheme>['colors'];
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

function PriceValue({
  amount,
  colors,
}: {
  amount: string | number;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.priceValue}>
      <Euro size={12} color={colors.foreground} />
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
  colors: ReturnType<typeof useTheme>['colors'];
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

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.roomDetail' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tRoomFields } = useTranslation('translation', { keyPrefix: 'app.rooms.fields' });
  const { colors } = useTheme();

  const insets = useSafeAreaInsets();
  const { data, isPending } = useRoom(id);

  if (isPending) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText variant="body" color={colors.tertiaryForeground}>
          {t('notFound')}
        </ThemedText>
        <ThemedButton variant="link" style={{ marginTop: 16 }} onPress={() => router.back()}>
          {t('backToDiscover')}
        </ThemedButton>
      </SafeAreaView>
    );
  }

  const { room, application } = data;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex}>
        <PhotoCarousel photos={room.photos} bucket={STORAGE_BUCKET_ROOM_PHOTOS} />

        <View style={styles.content}>
          <View>
            <ThemedText variant="title2">{room.title}</ThemedText>
            <View style={styles.locationRow}>
              <ThemedText variant="body" color={colors.tertiaryForeground}>
                {tEnums(`city.${room.city}`)}
              </ThemedText>
              {room.neighborhood && (
                <>
                  <Dot size={16} color={colors.mutedForeground} />
                  <ThemedText variant="body" color={colors.tertiaryForeground}>
                    {room.neighborhood}
                  </ThemedText>
                </>
              )}
            </View>
          </View>

          <GroupedSection>
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
              <ListSeparator insetLeft={0} />
              <View style={styles.totalRow}>
                <ThemedText variant="body" weight="600">
                  {t('totalCost')}
                </ThemedText>
                <View style={styles.priceValue}>
                  <Euro size={18} color={colors.primary} />
                  <ThemedText variant="headline" color={colors.primary}>
                    {room.totalCost}
                    {tCommon('perMonth')}
                  </ThemedText>
                </View>
              </View>
            </View>
          </GroupedSection>

          <GroupedSection>
            <View style={styles.sectionPadding}>
              <ThemedText variant="headline" style={styles.sectionTitle}>
                {t('details')}
              </ThemedText>
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
              {room.availableFrom && (
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
              )}
              {room.totalHousemates != null && (
                <DetailRow
                  label={tRoomFields('totalHousemates')}
                  value={tCommon('housemates', { count: Number(room.totalHousemates) })}
                  colors={colors}
                />
              )}
            </View>
          </GroupedSection>

          {room.features.length > 0 && (
            <View>
              <ThemedText variant="body" weight="600">
                {t('features')}
              </ThemedText>
              <View style={styles.chipRow}>
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
          )}

          {room.locationTags.length > 0 && (
            <View>
              <ThemedText variant="body" weight="600">
                {t('locationTags')}
              </ThemedText>
              <View style={styles.chipRow}>
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
          )}

          {room.latitude != null && room.longitude != null && (
            <View>
              <ThemedText variant="body" weight="600">
                {t('location')}
              </ThemedText>
              <View style={{ marginTop: 8 }}>
                <RoomLocationMap latitude={room.latitude} longitude={room.longitude} />
              </View>
              <ThemedText
                variant="caption1"
                color={colors.mutedForeground}
                style={{ marginTop: 8 }}>
                {t('approximateLocation')}
              </ThemedText>
            </View>
          )}

          <GroupedSection>
            <View style={styles.sectionPadding}>
              <ThemedText variant="headline" style={styles.sectionTitle}>
                {t('whoWereLookingFor')}
              </ThemedText>
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
              {(room.preferredAgeMin || room.preferredAgeMax) && (
                <DetailRow
                  label={t('ageRange')}
                  value={`${room.preferredAgeMin ?? '?'} - ${room.preferredAgeMax ?? '?'}`}
                  colors={colors}
                />
              )}
              {room.acceptedLanguages.length > 0 && (
                <DetailRow
                  label={t('acceptedLanguages')}
                  value={room.acceptedLanguages.map((l) => tEnums(`language_enum.${l}`)).join(', ')}
                  colors={colors}
                />
              )}
            </View>
          </GroupedSection>

          {room.description && (
            <View>
              <ThemedText variant="body" weight="600">
                {t('description')}
              </ThemedText>
              <ThemedText variant="subheadline" style={{ marginTop: 8, lineHeight: 20 }}>
                {room.description}
              </ThemedText>
            </View>
          )}

          {room.owner && (
            <GroupedSection>
              <View style={styles.sectionPadding}>
                <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                  {t('postedBy')}
                </ThemedText>
                <ThemedText variant="body" weight="500" style={{ marginTop: 4 }}>
                  {room.owner.firstName} {room.owner.lastName}
                </ThemedText>
                {room.owner.studyProgram && (
                  <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                    {room.owner.studyProgram}
                  </ThemedText>
                )}
              </View>
            </GroupedSection>
          )}

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}>
        {application ? (
          <ThemedButton
            variant="outline"
            size="lg"
            style={styles.bottomButton}
            onPress={() =>
              router.push({
                pathname: '/(app)/application/[id]',
                params: { id: application.id },
              })
            }>
            {t('viewApplication')}
          </ThemedButton>
        ) : (
          <ThemedButton
            size="lg"
            style={styles.bottomButton}
            onPress={() =>
              router.push({
                pathname: '/(app)/(modals)/apply-sheet',
                params: { roomId: id },
              })
            }>
            {t('apply')}
          </ThemedButton>
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
  content: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  locationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionPadding: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 8,
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
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chipRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureBadge: {
    borderRadius: radius.md,
  },
  bottomBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomButton: {
    height: 48,
    borderRadius: radius.xl,
  },
});
