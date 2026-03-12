import { City, Gender, StudyLevel, Vereniging } from '@openhospi/shared/enums';
import { useImperativeHandle, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChipPicker } from '@/components/chip-picker';
import { DatePickerSheet } from '@/components/date-picker-sheet';
import { SelectPickerSheet } from '@/components/select-picker-sheet';
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
import { useSubmitAbout } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@/services/types';

import type { StepHandle } from '@/components/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

function toDateObject(dateStr: string | null | undefined): Date {
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date(2000, 0, 1);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AboutStep({ ref, onNext, profile }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.fields' });
  const { t: tPlaceholders } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.placeholders',
  });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCityEnums } = useTranslation('translation', { keyPrefix: 'enums.city' });
  const { t: tVerenigingEnums } = useTranslation('translation', {
    keyPrefix: 'enums.vereniging',
  });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [gender, setGender] = useState<string | null>(profile?.gender ?? null);
  const [birthDate, setBirthDate] = useState(() => toDateObject(profile?.birthDate));
  const [studyProgram, setStudyProgram] = useState(profile?.studyProgram ?? '');
  const [studyLevel, setStudyLevel] = useState<Option | undefined>(
    profile?.studyLevel
      ? { value: profile.studyLevel, label: tEnums(`study_level.${profile.studyLevel}`) }
      : undefined
  );
  const [preferredCity, setPreferredCity] = useState<string | null>(profile?.preferredCity ?? null);
  const [vereniging, setVereniging] = useState<string | null>(profile?.vereniging ?? null);

  const submitAbout = useSubmitAbout();

  function handleSubmit() {
    if (!gender || !studyProgram.trim() || !preferredCity) {
      Alert.alert('Please complete all required fields.');
      return;
    }
    submitAbout.mutate(
      {
        gender,
        birthDate: toISODate(birthDate),
        studyProgram: studyProgram.trim(),
        studyLevel: studyLevel?.value || undefined,
        preferredCity,
        vereniging: vereniging || undefined,
      },
      { onSuccess: onNext, onError: () => Alert.alert('Error saving data') }
    );
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, gap: 16, paddingBottom: 32 }}>
      <View style={{ gap: 8 }}>
        <Label>{t('gender')}</Label>
        <ChipPicker
          values={Gender.values}
          selected={gender}
          onSelect={setGender}
          translateKey="gender"
          t={tEnums}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Label>{t('birthDate')}</Label>
        <DatePickerSheet
          value={birthDate}
          onChange={setBirthDate}
          title={t('birthDate')}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Label>{t('studyProgram')}</Label>
        <Input
          value={studyProgram}
          onChangeText={setStudyProgram}
          placeholder={tPlaceholders('studyProgram')}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Label>{t('studyLevel')}</Label>
        <Select value={studyLevel} onValueChange={setStudyLevel}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder={tPlaceholders('studyLevel')} />
          </SelectTrigger>
          <SelectContent>
            {StudyLevel.values.map((v) => (
              <SelectItem key={v} value={v} label={tEnums(`study_level.${v}`)}>
                {tEnums(`study_level.${v}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>

      <View style={{ gap: 8 }}>
        <Label>{t('preferredCity')}</Label>
        <SelectPickerSheet
          values={City.values}
          selected={preferredCity}
          onSelect={setPreferredCity}
          title={t('preferredCity')}
          placeholder={tPlaceholders('preferredCity')}
          searchPlaceholder={tPlaceholders('searchCity')}
          t={tCityEnums}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Label>
          {t('vereniging')} <Text variant="muted">({tCommon('optional')})</Text>
        </Label>
        <SelectPickerSheet
          values={Vereniging.values}
          selected={vereniging}
          onSelect={setVereniging}
          title={t('vereniging')}
          placeholder={tPlaceholders('vereniging')}
          searchPlaceholder={tPlaceholders('searchVereniging')}
          t={tVerenigingEnums}
        />
      </View>
    </ScrollView>
  );
}
