import { Furnishing, HouseType, RentalType, UtilitiesIncluded } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { SelectPickerSheet } from '@/components/forms/select-picker-sheet';
import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedInput } from '@/components/native/input';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { PlatformSurface } from '@/components/layout/platform-surface';
import { useTheme } from '@/design';
import { useMyRoom, useSaveDetails } from '@/services/my-rooms';

export default function DetailsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(roomId);
  const saveDetails = useSaveDetails();

  const [rentPrice, setRentPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<string>(UtilitiesIncluded.included);
  const [serviceCosts, setServiceCosts] = useState('');
  const [estimatedUtilitiesCosts, setEstimatedUtilitiesCosts] = useState('');
  const [roomSizeM2, setRoomSizeM2] = useState('');
  const [availableFrom, setAvailableFrom] = useState<Date>(new Date());
  const [availableUntil, setAvailableUntil] = useState<Date | null>(null);
  const [rentalType, setRentalType] = useState<string | null>(null);
  const [houseType, setHouseType] = useState<string | null>(null);
  const [furnishing, setFurnishing] = useState<string | null>(null);
  const [totalHousemates, setTotalHousemates] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (room && !initialized) {
    setRentPrice(room.rentPrice ? String(room.rentPrice) : '');
    setDeposit(room.deposit ? String(room.deposit) : '');
    setUtilitiesIncluded(room.utilitiesIncluded || UtilitiesIncluded.included);
    setServiceCosts(room.serviceCosts ? String(room.serviceCosts) : '');
    setEstimatedUtilitiesCosts(
      room.estimatedUtilitiesCosts ? String(room.estimatedUtilitiesCosts) : ''
    );
    setRoomSizeM2(room.roomSizeM2 ? String(room.roomSizeM2) : '');
    setAvailableFrom(room.availableFrom ? new Date(room.availableFrom) : new Date());
    setAvailableUntil(room.availableUntil ? new Date(room.availableUntil) : null);
    setRentalType(room.rentalType || null);
    setHouseType(room.houseType || null);
    setFurnishing(room.furnishing || null);
    setTotalHousemates(room.totalHousemates ? String(room.totalHousemates) : '');
    setInitialized(true);
  }

  const handleNext = async () => {
    try {
      await saveDetails.mutateAsync({
        roomId,
        data: {
          rentPrice: Number(rentPrice) || 0,
          deposit: deposit ? Number(deposit) : undefined,
          utilitiesIncluded: utilitiesIncluded || undefined,
          serviceCosts: serviceCosts ? Number(serviceCosts) : undefined,
          estimatedUtilitiesCosts: estimatedUtilitiesCosts
            ? Number(estimatedUtilitiesCosts)
            : undefined,
          roomSizeM2: roomSizeM2 ? Number(roomSizeM2) : undefined,
          availableFrom: availableFrom.toISOString().split('T')[0],
          availableUntil: availableUntil ? availableUntil.toISOString().split('T')[0] : undefined,
          rentalType: rentalType || undefined,
          houseType: houseType || undefined,
          furnishing: furnishing || undefined,
          totalHousemates: totalHousemates ? Number(totalHousemates) : undefined,
        },
      });
      router.push({ pathname: '/(app)/manage-room/create/preferences', params: { roomId } });
    } catch {
      Alert.alert(t('status.draftSaved'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <ThemedText variant="headline">{t('wizard.steps.details')}</ThemedText>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('wizard.stepDescriptions.step2')}
        </ThemedText>

        {/* Pricing */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('wizard.sections.pricing')}
          </ThemedText>
          <View style={styles.euroRow}>
            <NativeIcon name="eurosign" size={16} color={colors.tertiaryForeground} />
            <View style={styles.flex1}>
              <ThemedInput
                value={rentPrice}
                onChangeText={setRentPrice}
                placeholder={t('placeholders.rentPrice')}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.euroRow}>
            <NativeIcon name="eurosign" size={16} color={colors.tertiaryForeground} />
            <View style={styles.flex1}>
              <ThemedInput
                value={deposit}
                onChangeText={setDeposit}
                placeholder={t('placeholders.deposit')}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Utilities */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.utilitiesIncluded')}
          </ThemedText>
          <SelectPickerSheet
            values={UtilitiesIncluded.values}
            selected={utilitiesIncluded}
            onSelect={(v) => setUtilitiesIncluded(v ?? UtilitiesIncluded.included)}
            placeholder={t('fields.utilitiesIncluded')}
            searchPlaceholder={t('fields.utilitiesIncluded')}
            translationKeyPrefix="app.rooms.utilities"
          />
        </View>

        {utilitiesIncluded !== UtilitiesIncluded.included && (
          <View style={styles.euroRow}>
            <NativeIcon name="eurosign" size={16} color={colors.tertiaryForeground} />
            <View style={styles.flex1}>
              <ThemedInput
                value={serviceCosts}
                onChangeText={setServiceCosts}
                placeholder={t('placeholders.serviceCosts')}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {utilitiesIncluded === UtilitiesIncluded.estimated && (
          <View style={styles.euroRow}>
            <NativeIcon name="eurosign" size={16} color={colors.tertiaryForeground} />
            <View style={styles.flex1}>
              <ThemedInput
                value={estimatedUtilitiesCosts}
                onChangeText={setEstimatedUtilitiesCosts}
                placeholder={t('placeholders.estimatedUtilitiesCosts')}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Property */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('wizard.sections.property')}
          </ThemedText>
          <ThemedInput
            value={roomSizeM2}
            onChangeText={setRoomSizeM2}
            placeholder={t('placeholders.roomSize')}
            keyboardType="numeric"
          />
          <ThemedInput
            value={totalHousemates}
            onChangeText={setTotalHousemates}
            placeholder={t('placeholders.totalHousemates')}
            keyboardType="numeric"
          />
        </View>

        {/* House Type */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.houseType')}
          </ThemedText>
          <SelectPickerSheet
            values={HouseType.values}
            selected={houseType}
            onSelect={setHouseType}
            placeholder={t('fields.houseType')}
            searchPlaceholder={t('fields.houseType')}
            translationKeyPrefix="enums.house_type"
          />
        </View>

        {/* Furnishing */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.furnishing')}
          </ThemedText>
          <SelectPickerSheet
            values={Furnishing.values}
            selected={furnishing}
            onSelect={setFurnishing}
            placeholder={t('fields.furnishing')}
            searchPlaceholder={t('fields.furnishing')}
            translationKeyPrefix="enums.furnishing"
          />
        </View>

        {/* Rental Type */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.rentalType')}
          </ThemedText>
          <SelectPickerSheet
            values={RentalType.values}
            selected={rentalType}
            onSelect={setRentalType}
            placeholder={t('fields.rentalType')}
            searchPlaceholder={t('fields.rentalType')}
            translationKeyPrefix="enums.rental_type"
          />
        </View>

        {/* Availability */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('wizard.sections.availability')}
          </ThemedText>
          <DatePickerSheet
            title={t('fields.availableFrom')}
            value={availableFrom}
            onChange={setAvailableFrom}
            minimumDate={new Date()}
          />
          {rentalType && rentalType !== RentalType.permanent && (
            <DatePickerSheet
              title={t('fields.availableUntil')}
              value={availableUntil ?? new Date()}
              onChange={setAvailableUntil}
              minimumDate={availableFrom}
            />
          )}
        </View>
      </ScrollView>

      <PlatformSurface
        variant="chrome"
        edge="bottom"
        glass="regular"
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: Math.max(bottom, spacing.lg),
          gap: spacing.sm,
        }}>
        <NativeButton
          label={tCommon('next')}
          onPress={handleNext}
          loading={saveDetails.isPending}
        />
      </PlatformSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, padding: 16, gap: 12 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  fieldGroup: { gap: 8 },
  euroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex1: { flex: 1 },
});
