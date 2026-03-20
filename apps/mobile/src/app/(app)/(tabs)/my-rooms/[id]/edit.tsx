import {
  City,
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
import { Euro } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { MultiChipPicker } from '@/components/multi-chip-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { useMyRoom, useUpdateRoom } from '@/services/my-rooms';

export default function EditRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(id);
  const updateRoom = useUpdateRoom();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<string>(City.amsterdam);
  const [neighborhood, setNeighborhood] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
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

  if (room && !initialized) {
    setTitle(room.title || '');
    setDescription(room.description || '');
    setCity(room.city || City.amsterdam);
    setNeighborhood(room.neighborhood || '');
    setStreetName(room.streetName || '');
    setHouseNumber(room.houseNumber || '');
    setPostalCode(room.postalCode || '');
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

  const cityOption: Option | undefined = useMemo(
    () => (city ? { value: city, label: tEnums(`city.${city}`) } : undefined),
    [city, tEnums]
  );

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
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled">
        {/* Basic Info */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.title')}</Label>
          <Input value={title} onChangeText={setTitle} placeholder={t('placeholders.title')} />
        </View>

        <View style={{ gap: 8 }}>
          <Label>{t('fields.description')}</Label>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder={t('placeholders.description')}
            multiline
            numberOfLines={4}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Label>{t('fields.city')}</Label>
          <Select value={cityOption} onValueChange={(opt) => opt && setCity(opt.value)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={t('fields.city')} />
            </SelectTrigger>
            <SelectContent>
              {City.values.map((v) => (
                <SelectItem key={v} value={v} label={tEnums(`city.${v}`)}>
                  {tEnums(`city.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        {/* Address */}
        <View style={{ gap: 8 }}>
          <Input
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder={t('placeholders.neighborhood')}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 2 }}>
              <Input
                value={streetName}
                onChangeText={setStreetName}
                placeholder={t('fields.streetName')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder={t('fields.houseNumber')}
              />
            </View>
          </View>
          <Input
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder={t('fields.postalCode')}
          />
        </View>

        {/* Pricing */}
        <View style={{ gap: 8 }}>
          <Label>{t('wizard.sections.pricing')}</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Euro size={16} className="text-muted-foreground" />
            <View style={{ flex: 1 }}>
              <Input
                value={rentPrice}
                onChangeText={setRentPrice}
                placeholder={t('placeholders.rentPrice')}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Euro size={16} className="text-muted-foreground" />
            <View style={{ flex: 1 }}>
              <Input
                value={deposit}
                onChangeText={setDeposit}
                placeholder={t('placeholders.deposit')}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Euro size={16} className="text-muted-foreground" />
            <View style={{ flex: 1 }}>
              <Input
                value={serviceCosts}
                onChangeText={setServiceCosts}
                placeholder={t('placeholders.serviceCosts')}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Utilities */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.utilitiesIncluded')}</Label>
          <Select
            value={{
              value: utilitiesIncluded,
              label: t(`utilities.${utilitiesIncluded}` as never),
            }}
            onValueChange={(opt) => opt && setUtilitiesIncluded(opt.value)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={t('fields.utilitiesIncluded')} />
            </SelectTrigger>
            <SelectContent>
              {UtilitiesIncluded.values.map((v) => (
                <SelectItem key={v} value={v} label={t(`utilities.${v}` as never)}>
                  {t(`utilities.${v}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        {/* Property */}
        <View style={{ gap: 8 }}>
          <Label>{t('wizard.sections.property')}</Label>
          <Input
            value={roomSizeM2}
            onChangeText={setRoomSizeM2}
            placeholder={t('placeholders.roomSize')}
            keyboardType="numeric"
          />
          <Input
            value={totalHousemates}
            onChangeText={setTotalHousemates}
            placeholder={t('placeholders.totalHousemates')}
            keyboardType="numeric"
          />
        </View>

        {/* House Type */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.houseType')}</Label>
          <Select
            value={
              houseType ? { value: houseType, label: tEnums(`house_type.${houseType}`) } : undefined
            }
            onValueChange={(opt) => setHouseType(opt?.value ?? null)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={t('fields.houseType')} />
            </SelectTrigger>
            <SelectContent>
              {HouseType.values.map((v) => (
                <SelectItem key={v} value={v} label={tEnums(`house_type.${v}`)}>
                  {tEnums(`house_type.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        {/* Furnishing */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.furnishing')}</Label>
          <Select
            value={
              furnishing
                ? { value: furnishing, label: tEnums(`furnishing.${furnishing}`) }
                : undefined
            }
            onValueChange={(opt) => setFurnishing(opt?.value ?? null)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={t('fields.furnishing')} />
            </SelectTrigger>
            <SelectContent>
              {Furnishing.values.map((v) => (
                <SelectItem key={v} value={v} label={tEnums(`furnishing.${v}`)}>
                  {tEnums(`furnishing.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        {/* Rental Type */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.rentalType')}</Label>
          <Select
            value={
              rentalType
                ? { value: rentalType, label: tEnums(`rental_type.${rentalType}`) }
                : undefined
            }
            onValueChange={(opt) => setRentalType(opt?.value ?? null)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={t('fields.rentalType')} />
            </SelectTrigger>
            <SelectContent>
              {RentalType.values.map((v) => (
                <SelectItem key={v} value={v} label={tEnums(`rental_type.${v}`)}>
                  {tEnums(`rental_type.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        {/* Availability */}
        <View style={{ gap: 8 }}>
          <Label>{t('wizard.sections.availability')}</Label>
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

        {/* Features */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.features')}</Label>
          <MultiChipPicker
            values={RoomFeature.values}
            selected={features}
            onToggle={setFeatures}
            translateKey="room_feature"
            t={tEnums}
          />
        </View>

        {/* Location Tags */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.locationTags')}</Label>
          <MultiChipPicker
            values={LocationTag.values}
            selected={locationTags}
            onToggle={setLocationTags}
            translateKey="location_tag"
            t={tEnums}
          />
        </View>

        {/* Languages */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.acceptedLanguages')}</Label>
          <MultiChipPicker
            values={Language.values}
            selected={acceptedLanguages}
            onToggle={setAcceptedLanguages}
            translateKey="language"
            t={tEnums}
          />
        </View>

        {/* Association */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.roomVereniging')}</Label>
          <Input
            value={roomVereniging}
            onChangeText={setRoomVereniging}
            placeholder={t('placeholders.searchVereniging')}
          />
        </View>
      </ScrollView>

      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button onPress={handleSave} disabled={updateRoom.isPending || !title.trim()}>
          {updateRoom.isPending ? (
            <ActivityIndicator className="accent-primary-foreground" />
          ) : (
            <Text>{tCommon('save')}</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
