import { type AddressResult } from '@openhospi/shared/pdok';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AddressSearchInput } from '@/components/forms/address-search';
import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/native/input';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import RoomLocationMap from '@/components/rooms/room-location-map';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { useMyRoom, useSaveBasicInfo } from '@/services/my-rooms';

export default function BasicInfoScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const { data: room, isLoading } = useMyRoom(roomId);
  const saveBasicInfo = useSaveBasicInfo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [initialized, setInitialized] = useState(false);

  if (room && !initialized) {
    setTitle(room.title || '');
    setDescription(room.description || '');
    setCity(room.city || '');
    setNeighborhood(room.neighborhood || '');
    setStreetName(room.streetName || '');
    setHouseNumber(room.houseNumber || '');
    setPostalCode(room.postalCode || '');
    setInitialized(true);
  }

  function handleAddressSelect(address: AddressResult) {
    setCity(address.city);
    setStreetName(address.streetName);
    setHouseNumber(address.houseNumber);
    setPostalCode(address.postalCode);
    setNeighborhood(address.neighborhood);
    setLatitude(address.latitude);
    setLongitude(address.longitude);
  }

  const addressDisplay = streetName
    ? `${streetName} ${houseNumber}, ${postalCode} ${city}`.trim()
    : '';

  const handleNext = async () => {
    try {
      await saveBasicInfo.mutateAsync({
        roomId,
        data: {
          title,
          description: description || undefined,
          city,
          neighborhood: neighborhood || undefined,
          streetName: streetName || undefined,
          houseNumber: houseNumber || undefined,
          postalCode: postalCode || undefined,
          latitude,
          longitude,
        },
      });
      router.push({ pathname: '/(app)/manage-room/create/details', params: { roomId } });
    } catch {
      Alert.alert(tErrors('generic'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.scrollContent, { padding: 16 }]}>
          <ThemedSkeleton width="60%" height={24} />
          <ThemedSkeleton width="100%" height={44} rounded="lg" />
          <ThemedSkeleton width="100%" height={80} rounded="lg" />
          <ThemedSkeleton width="100%" height={44} rounded="lg" />
          <ThemedSkeleton width="100%" height={44} rounded="lg" />
        </View>
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
        <ThemedText variant="headline">{t('wizard.steps.basicInfo')}</ThemedText>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('wizard.stepDescriptions.step1')}
        </ThemedText>

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
            style={styles.descriptionInput}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.address')}
          </ThemedText>
          <AddressSearchInput
            displayValue={addressDisplay}
            onSelect={handleAddressSelect}
            placeholder={t('placeholders.searchAddress')}
          />
          {addressDisplay ? (
            <View style={styles.addressDetails}>
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {streetName} {houseNumber}, {postalCode} {city}
              </ThemedText>
              {neighborhood ? (
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {t('fields.neighborhood')}: {neighborhood}
                </ThemedText>
              ) : null}
            </View>
          ) : null}
          {latitude && longitude ? (
            <RoomLocationMap latitude={latitude} longitude={longitude} />
          ) : null}
        </View>
      </ScrollView>

      <BlurBottomBar>
        <NativeButton
          label={tCommon('next')}
          onPress={handleNext}
          loading={saveBasicInfo.isPending}
          disabled={!title.trim()}
        />
      </BlurBottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  fieldGroup: { gap: 8 },
  descriptionInput: { minHeight: 80, textAlignVertical: 'top' },
  addressDetails: { gap: 2, paddingHorizontal: 4 },
});
