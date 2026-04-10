import { Furnishing, HouseType, RentalType, UtilitiesIncluded } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Euro } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { AppBottomSheetModal, type BottomSheetModal } from '@/components/shared/bottom-sheet';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';
import { NativeSelect } from '@/components/primitives/native-select';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';
import { useMyRoom, useSaveDetails } from '@/services/my-rooms';

export default function DetailsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
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

  // Sheet refs for pickers
  const utilitiesSheetRef = useRef<BottomSheetModal>(null);
  const houseTypeSheetRef = useRef<BottomSheetModal>(null);
  const furnishingSheetRef = useRef<BottomSheetModal>(null);
  const rentalTypeSheetRef = useRef<BottomSheetModal>(null);

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
      router.push({ pathname: '/(app)/(tabs)/my-rooms/create/preferences', params: { roomId } });
    } catch {
      Alert.alert(t('status.draftSaved'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
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
            <Euro size={16} color={colors.tertiaryForeground} />
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
            <Euro size={16} color={colors.tertiaryForeground} />
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
          <NativeSelect
            value={utilitiesIncluded}
            options={UtilitiesIncluded.values.map((v: string) => ({
              value: v,
              label: t(`utilities.${v}` as never),
            }))}
            onValueChange={setUtilitiesIncluded}
            onPress={() => utilitiesSheetRef.current?.present()}
          />
        </View>

        {utilitiesIncluded !== UtilitiesIncluded.included && (
          <View style={styles.euroRow}>
            <Euro size={16} color={colors.tertiaryForeground} />
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
            <Euro size={16} color={colors.tertiaryForeground} />
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
          <NativeSelect
            value={houseType ?? undefined}
            placeholder={t('fields.houseType')}
            options={HouseType.values.map((v: string) => ({
              value: v,
              label: tEnums(`house_type.${v}`),
            }))}
            onValueChange={(v) => setHouseType(v)}
            onPress={() => houseTypeSheetRef.current?.present()}
          />
        </View>

        {/* Furnishing */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.furnishing')}
          </ThemedText>
          <NativeSelect
            value={furnishing ?? undefined}
            placeholder={t('fields.furnishing')}
            options={Furnishing.values.map((v: string) => ({
              value: v,
              label: tEnums(`furnishing.${v}`),
            }))}
            onValueChange={(v) => setFurnishing(v)}
            onPress={() => furnishingSheetRef.current?.present()}
          />
        </View>

        {/* Rental Type */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.rentalType')}
          </ThemedText>
          <NativeSelect
            value={rentalType ?? undefined}
            placeholder={t('fields.rentalType')}
            options={RentalType.values.map((v: string) => ({
              value: v,
              label: tEnums(`rental_type.${v}`),
            }))}
            onValueChange={(v) => setRentalType(v)}
            onPress={() => rentalTypeSheetRef.current?.present()}
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

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.separator, paddingBottom: Math.max(bottom, 16) },
        ]}>
        <ThemedButton onPress={handleNext} loading={saveDetails.isPending}>
          {tCommon('next')}
        </ThemedButton>
      </View>

      {/* Picker sheets */}
      <PickerSheet
        ref={utilitiesSheetRef}
        options={UtilitiesIncluded.values.map((v: string) => ({
          value: v,
          label: t(`utilities.${v}` as never),
        }))}
        selected={utilitiesIncluded}
        onSelect={(v) => {
          setUtilitiesIncluded(v);
          utilitiesSheetRef.current?.dismiss();
        }}
      />
      <PickerSheet
        ref={houseTypeSheetRef}
        options={HouseType.values.map((v: string) => ({
          value: v,
          label: tEnums(`house_type.${v}`),
        }))}
        selected={houseType}
        onSelect={(v) => {
          setHouseType(v);
          houseTypeSheetRef.current?.dismiss();
        }}
      />
      <PickerSheet
        ref={furnishingSheetRef}
        options={Furnishing.values.map((v: string) => ({
          value: v,
          label: tEnums(`furnishing.${v}`),
        }))}
        selected={furnishing}
        onSelect={(v) => {
          setFurnishing(v);
          furnishingSheetRef.current?.dismiss();
        }}
      />
      <PickerSheet
        ref={rentalTypeSheetRef}
        options={RentalType.values.map((v: string) => ({
          value: v,
          label: tEnums(`rental_type.${v}`),
        }))}
        selected={rentalType}
        onSelect={(v) => {
          setRentalType(v);
          rentalTypeSheetRef.current?.dismiss();
        }}
      />
    </View>
  );
}

function PickerSheet({
  ref,
  options,
  selected,
  onSelect,
}: {
  ref: React.Ref<BottomSheetModal>;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <AppBottomSheetModal ref={ref} enableDynamicSizing scrollable={false}>
      <View style={styles.pickerContent}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => {
              hapticLight();
              onSelect(opt.value);
            }}
            android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
            style={[
              styles.pickerRow,
              selected === opt.value ? { backgroundColor: colors.accent } : undefined,
            ]}>
            <ThemedText
              variant="body"
              weight={selected === opt.value ? '600' : '400'}
              color={selected === opt.value ? colors.primary : colors.foreground}>
              {opt.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </AppBottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  fieldGroup: { gap: 8 },
  euroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex1: { flex: 1 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pickerContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerRow: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
