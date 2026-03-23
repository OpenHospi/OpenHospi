import { GenderPreference, Language, LocationTag, RoomFeature } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
import { useMyRoom, useSavePreferences } from '@/services/my-rooms';

export default function PreferencesScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(roomId);
  const savePreferences = useSavePreferences();

  const [features, setFeatures] = useState<string[]>([]);
  const [locationTags, setLocationTags] = useState<string[]>([]);
  const [preferredGender, setPreferredGender] = useState<string>(GenderPreference.no_preference);
  const [preferredAgeMin, setPreferredAgeMin] = useState('');
  const [preferredAgeMax, setPreferredAgeMax] = useState('');
  const [acceptedLanguages, setAcceptedLanguages] = useState<string[]>([]);
  const [roomVereniging, setRoomVereniging] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (room && !initialized) {
    setFeatures(room.features || []);
    setLocationTags(room.locationTags || []);
    setPreferredGender(room.preferredGender || GenderPreference.no_preference);
    setPreferredAgeMin(room.preferredAgeMin ? String(room.preferredAgeMin) : '');
    setPreferredAgeMax(room.preferredAgeMax ? String(room.preferredAgeMax) : '');
    setAcceptedLanguages(room.acceptedLanguages || []);
    setRoomVereniging(room.roomVereniging || '');
    setInitialized(true);
  }

  const genderOption: Option | undefined = useMemo(
    () => ({
      value: preferredGender,
      label: tEnums(`gender_preference.${preferredGender}`),
    }),
    [preferredGender, tEnums]
  );

  const handleNext = async () => {
    try {
      await savePreferences.mutateAsync({
        roomId,
        data: {
          features,
          locationTags,
          preferredGender: preferredGender || undefined,
          preferredAgeMin: preferredAgeMin ? Number(preferredAgeMin) : undefined,
          preferredAgeMax: preferredAgeMax ? Number(preferredAgeMax) : undefined,
          acceptedLanguages,
          roomVereniging: roomVereniging || undefined,
        },
      });
      router.push({ pathname: '/(app)/(tabs)/my-rooms/create/photos', params: { roomId } });
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
        <Text className="text-foreground text-lg font-semibold">
          {t('wizard.steps.preferences')}
        </Text>
        <Text variant="muted" className="text-sm">
          {t('wizard.stepDescriptions.step3')}
        </Text>

        {/* Features */}
        <View style={{ gap: 8 }}>
          <Label>{t('wizard.sections.features')}</Label>
          <Text variant="muted" className="text-xs">
            {t('wizard.sectionDescriptions.features')}
          </Text>
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

        {/* Preferences */}
        <View style={{ gap: 8 }}>
          <Label>{t('wizard.sections.preferences')}</Label>
          <Text variant="muted" className="text-xs">
            {t('wizard.sectionDescriptions.preferences')}
          </Text>

          <Select
            value={genderOption}
            onValueChange={(option) => option && setPreferredGender(option.value)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={t('fields.preferredGender')} />
            </SelectTrigger>
            <SelectContent>
              {GenderPreference.values.map((v) => (
                <SelectItem key={v} value={v} label={tEnums(`gender_preference.${v}`)}>
                  {tEnums(`gender_preference.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                value={preferredAgeMin}
                onChangeText={setPreferredAgeMin}
                placeholder={t('fields.preferredAgeMin')}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                value={preferredAgeMax}
                onChangeText={setPreferredAgeMax}
                placeholder={t('fields.preferredAgeMax')}
                keyboardType="numeric"
              />
            </View>
          </View>
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
          <Label>{t('wizard.sections.association')}</Label>
          <Text variant="muted" className="text-xs">
            {t('wizard.sectionDescriptions.association')}
          </Text>
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
        <Button onPress={handleNext} disabled={savePreferences.isPending}>
          {savePreferences.isPending ? (
            <ActivityIndicator className="accent-primary-foreground" />
          ) : (
            <Text>{tCommon('next')}</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
