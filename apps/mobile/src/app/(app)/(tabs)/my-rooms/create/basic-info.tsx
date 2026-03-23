import { City } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
import { useMyRoom, useSaveBasicInfo } from '@/services/my-rooms';

export default function BasicInfoScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(roomId);
  const saveBasicInfo = useSaveBasicInfo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<string>(City.amsterdam);
  const [neighborhood, setNeighborhood] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (room && !initialized) {
    setTitle(room.title || '');
    setDescription(room.description || '');
    setCity(room.city || City.amsterdam);
    setNeighborhood(room.neighborhood || '');
    setStreetName(room.streetName || '');
    setHouseNumber(room.houseNumber || '');
    setPostalCode(room.postalCode || '');
    setInitialized(true);
  }

  const cityOption: Option | undefined = useMemo(
    () => (city ? { value: city, label: tEnums(`city.${city}`) } : undefined),
    [city, tEnums]
  );

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
        },
      });
      router.push({ pathname: '/(app)/(tabs)/my-rooms/create/details', params: { roomId } });
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
        <Text className="text-foreground text-lg font-semibold">{t('wizard.steps.basicInfo')}</Text>
        <Text variant="muted" className="text-sm">
          {t('wizard.stepDescriptions.step1')}
        </Text>

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
          <Select value={cityOption} onValueChange={(option) => option && setCity(option.value)}>
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

        <View style={{ gap: 8 }}>
          <Label>{t('wizard.sections.location')}</Label>
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
      </ScrollView>

      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button onPress={handleNext} disabled={saveBasicInfo.isPending || !title.trim()}>
          {saveBasicInfo.isPending ? (
            <ActivityIndicator className="accent-primary-foreground" />
          ) : (
            <Text>{tCommon('next')}</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
