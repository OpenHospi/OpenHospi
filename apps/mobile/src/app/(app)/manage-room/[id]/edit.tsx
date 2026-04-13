import {
  Furnishing,
  GenderPreference,
  HouseType,
  Language,
  LocationTag,
  RentalType,
  RoomFeature,
  UtilitiesIncluded,
} from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { MultiChipPicker } from '@/components/forms/multi-chip-picker';
import { CitySearchInput } from '@/components/forms/city-search';
import { AppBottomSheetModal, type BottomSheetModal } from '@/components/shared/bottom-sheet';
import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/native/input';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeSelect } from '@/components/native/select';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';
import { useMyRoom, useUpdateRoom } from '@/services/my-rooms';

function SkeletonEditRoom() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.scrollContent}>
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={80} rounded="lg" />
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
      </View>
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

export default function EditRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

  const { data: room, isLoading } = useMyRoom(id);
  const updateRoom = useUpdateRoom();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [province, setProvince] = useState('');
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
  const [features, setFeatures] = useState<string[]>([]);
  const [locationTags, setLocationTags] = useState<string[]>([]);
  const [preferredGender, setPreferredGender] = useState<string>(GenderPreference.no_preference);
  const [preferredAgeMin, setPreferredAgeMin] = useState('');
  const [preferredAgeMax, setPreferredAgeMax] = useState('');
  const [acceptedLanguages, setAcceptedLanguages] = useState<string[]>([]);
  const [roomVereniging, setRoomVereniging] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Bottom sheet refs
  const utilitiesSheetRef = useRef<BottomSheetModal>(null);
  const houseTypeSheetRef = useRef<BottomSheetModal>(null);
  const furnishingSheetRef = useRef<BottomSheetModal>(null);
  const rentalTypeSheetRef = useRef<BottomSheetModal>(null);
  const genderSheetRef = useRef<BottomSheetModal>(null);

  if (room && !initialized) {
    setTitle(room.title || '');
    setDescription(room.description || '');
    setCity(room.city || '');
    setNeighborhood(room.neighborhood || '');
    setStreetName(room.streetName || '');
    setHouseNumber(room.houseNumber || '');
    setPostalCode(room.postalCode || '');
    setMunicipality(room.municipality || '');
    setProvince(room.province || '');
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
    setFeatures(room.features || []);
    setLocationTags(room.locationTags || []);
    setPreferredGender(room.preferredGender || GenderPreference.no_preference);
    setPreferredAgeMin(room.preferredAgeMin ? String(room.preferredAgeMin) : '');
    setPreferredAgeMax(room.preferredAgeMax ? String(room.preferredAgeMax) : '');
    setAcceptedLanguages(room.acceptedLanguages || []);
    setRoomVereniging(room.roomVereniging || '');
    setInitialized(true);
  }

  const handleSave = async () => {
    try {
      await updateRoom.mutateAsync({
        roomId: id,
        data: {
          title,
          description: description || undefined,
          city,
          neighborhood: neighborhood || undefined,
          streetName: streetName || undefined,
          houseNumber: houseNumber || undefined,
          postalCode: postalCode || undefined,
          municipality: municipality || undefined,
          province: province || undefined,
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
          features,
          locationTags,
          preferredGender: preferredGender || undefined,
          preferredAgeMin: preferredAgeMin ? Number(preferredAgeMin) : undefined,
          preferredAgeMax: preferredAgeMax ? Number(preferredAgeMax) : undefined,
          acceptedLanguages,
          roomVereniging: roomVereniging || undefined,
        },
      });
      router.back();
    } catch {
      Alert.alert(t('status.createFailed'));
    }
  };

  if (isLoading) {
    return <SkeletonEditRoom />;
  }

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Basic Info */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.title')}
          </ThemedText>
          <ThemedInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('placeholders.title')}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.description')}
          </ThemedText>
          <ThemedInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('placeholders.description')}
            multiline
            numberOfLines={4}
            style={styles.multilineInput}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.city')}
          </ThemedText>
          <CitySearchInput value={city} onSelect={setCity} placeholder={t('fields.city')} />
        </View>

        {/* Address */}
        <View style={styles.fieldGroup}>
          <ThemedInput
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder={t('placeholders.neighborhood')}
          />
          <View style={styles.rowGap}>
            <View style={styles.flex2}>
              <ThemedInput
                value={streetName}
                onChangeText={setStreetName}
                placeholder={t('fields.streetName')}
              />
            </View>
            <View style={styles.flex1}>
              <ThemedInput
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder={t('fields.houseNumber')}
              />
            </View>
          </View>
          <ThemedInput
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder={t('fields.postalCode')}
          />
        </View>

        {/* Pricing */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('wizard.sections.pricing')}
          </ThemedText>
          <View style={styles.iconInputRow}>
            {isIOS ? (
              <SymbolView name="eurosign" size={16} tintColor={colors.tertiaryForeground} />
            ) : (
              <MaterialIcons name="euro" size={16} color={colors.tertiaryForeground} />
            )}
            <View style={styles.flex1}>
              <ThemedInput
                value={rentPrice}
                onChangeText={setRentPrice}
                placeholder={t('placeholders.rentPrice')}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.iconInputRow}>
            {isIOS ? (
              <SymbolView name="eurosign" size={16} tintColor={colors.tertiaryForeground} />
            ) : (
              <MaterialIcons name="euro" size={16} color={colors.tertiaryForeground} />
            )}
            <View style={styles.flex1}>
              <ThemedInput
                value={deposit}
                onChangeText={setDeposit}
                placeholder={t('placeholders.deposit')}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.iconInputRow}>
            {isIOS ? (
              <SymbolView name="eurosign" size={16} tintColor={colors.tertiaryForeground} />
            ) : (
              <MaterialIcons name="euro" size={16} color={colors.tertiaryForeground} />
            )}
            <View style={styles.flex1}>
              <ThemedInput
                value={serviceCosts}
                onChangeText={setServiceCosts}
                placeholder={t('placeholders.serviceCosts')}
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

        {utilitiesIncluded === UtilitiesIncluded.estimated && (
          <View style={styles.iconInputRow}>
            {isIOS ? (
              <SymbolView name="eurosign" size={16} tintColor={colors.tertiaryForeground} />
            ) : (
              <MaterialIcons name="euro" size={16} color={colors.tertiaryForeground} />
            )}
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

        {/* Gender Preference */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.preferredGender')}
          </ThemedText>
          <NativeSelect
            value={preferredGender}
            options={GenderPreference.values.map((v: string) => ({
              value: v,
              label: tEnums(`gender_preference.${v}`),
            }))}
            onValueChange={setPreferredGender}
            onPress={() => genderSheetRef.current?.present()}
          />

          <View style={styles.rowGap}>
            <View style={styles.flex1}>
              <ThemedInput
                value={preferredAgeMin}
                onChangeText={setPreferredAgeMin}
                placeholder={t('fields.preferredAgeMin')}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <ThemedInput
                value={preferredAgeMax}
                onChangeText={setPreferredAgeMax}
                placeholder={t('fields.preferredAgeMax')}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.features')}
          </ThemedText>
          <MultiChipPicker
            values={RoomFeature.values}
            selected={features}
            onToggle={setFeatures}
            translateKey="room_feature"
            t={tEnums}
          />
        </View>

        {/* Location Tags */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.locationTags')}
          </ThemedText>
          <MultiChipPicker
            values={LocationTag.values}
            selected={locationTags}
            onToggle={setLocationTags}
            translateKey="location_tag"
            t={tEnums}
          />
        </View>

        {/* Languages */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.acceptedLanguages')}
          </ThemedText>
          <MultiChipPicker
            values={Language.values}
            selected={acceptedLanguages}
            onToggle={setAcceptedLanguages}
            translateKey="language"
            t={tEnums}
          />
        </View>

        {/* Association */}
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.roomVereniging')}
          </ThemedText>
          <ThemedInput
            value={roomVereniging}
            onChangeText={setRoomVereniging}
            placeholder={t('placeholders.searchVereniging')}
          />
        </View>
      </ScrollView>

      <BlurBottomBar>
        <NativeButton
          label={tCommon('save')}
          onPress={handleSave}
          loading={updateRoom.isPending}
          disabled={!title.trim()}
        />
      </BlurBottomBar>

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
      <PickerSheet
        ref={genderSheetRef}
        options={GenderPreference.values.map((v: string) => ({
          value: v,
          label: tEnums(`gender_preference.${v}`),
        }))}
        selected={preferredGender}
        onSelect={(v) => {
          setPreferredGender(v);
          genderSheetRef.current?.dismiss();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  fieldGroup: {
    gap: 8,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowGap: {
    flexDirection: 'row',
    gap: 8,
  },
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerRow: {
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonContainer: {
    flex: 1,
  },
});
