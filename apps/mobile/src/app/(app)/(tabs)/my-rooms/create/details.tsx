import { Furnishing, HouseType, RentalType, UtilitiesIncluded } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Euro } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/date-picker-sheet';
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
import { useMyRoom, useSaveDetails } from '@/services/my-rooms';

export default function DetailsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
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

  const utilitiesOption: Option | undefined = useMemo(
    () => ({
      value: utilitiesIncluded,
      label: t(`utilities.${utilitiesIncluded}` as never),
    }),
    [utilitiesIncluded, t]
  );

  const rentalTypeOption: Option | undefined = useMemo(
    () =>
      rentalType ? { value: rentalType, label: tEnums(`rental_type.${rentalType}`) } : undefined,
    [rentalType, tEnums]
  );

  const houseTypeOption: Option | undefined = useMemo(
    () => (houseType ? { value: houseType, label: tEnums(`house_type.${houseType}`) } : undefined),
    [houseType, tEnums]
  );

  const furnishingOption: Option | undefined = useMemo(
    () =>
      furnishing ? { value: furnishing, label: tEnums(`furnishing.${furnishing}`) } : undefined,
    [furnishing, tEnums]
  );

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
        <Text className="text-foreground text-lg font-semibold">{t('wizard.steps.details')}</Text>
        <Text variant="muted" className="text-sm">
          {t('wizard.stepDescriptions.step2')}
        </Text>

        {/* Pricing */}
        <View style={{ gap: 8 }}>
          <Label>{t('wizard.sections.pricing')}</Label>
          <View style={{ gap: 8 }}>
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
          </View>
        </View>

        {/* Utilities */}
        <View style={{ gap: 8 }}>
          <Label>{t('fields.utilitiesIncluded')}</Label>
          <Select
            value={utilitiesOption}
            onValueChange={(option) => option && setUtilitiesIncluded(option.value)}>
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

        {utilitiesIncluded !== UtilitiesIncluded.included && (
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
        )}

        {utilitiesIncluded === UtilitiesIncluded.estimated && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Euro size={16} className="text-muted-foreground" />
            <View style={{ flex: 1 }}>
              <Input
                value={estimatedUtilitiesCosts}
                onChangeText={setEstimatedUtilitiesCosts}
                placeholder={t('placeholders.estimatedUtilitiesCosts')}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

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
            value={houseTypeOption}
            onValueChange={(option) => setHouseType(option?.value ?? null)}>
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
            value={furnishingOption}
            onValueChange={(option) => setFurnishing(option?.value ?? null)}>
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
            value={rentalTypeOption}
            onValueChange={(option) => setRentalType(option?.value ?? null)}>
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
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button onPress={handleNext} disabled={saveDetails.isPending}>
          {saveDetails.isPending ? (
            <ActivityIndicator className="accent-primary-foreground" />
          ) : (
            <Text>{tCommon('next')}</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
