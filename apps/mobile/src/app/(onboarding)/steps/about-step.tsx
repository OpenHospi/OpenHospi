import { Gender, StudyLevel, Vereniging } from '@openhospi/shared/enums';
import { useImperativeHandle, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChipPicker } from '@/components/forms/chip-picker';
import { CitySearchInput } from '@/components/forms/city-search';
import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { SelectPickerSheet } from '@/components/forms/select-picker-sheet';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { useSubmitAbout } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';

import type { StepHandle } from '@/components/shared/onboarding-types';

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
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.fields' });
  const { t: tOnboarding } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tPlaceholders } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.placeholders',
  });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tVerenigingEnums } = useTranslation('translation', {
    keyPrefix: 'enums.vereniging',
  });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const [gender, setGender] = useState<string | null>(profile?.gender ?? null);
  const [birthDate, setBirthDate] = useState(() => toDateObject(profile?.birthDate));
  const [studyProgram, setStudyProgram] = useState(profile?.studyProgram ?? '');
  const [studyLevel, setStudyLevel] = useState<string | null>(profile?.studyLevel ?? null);
  const [preferredCity, setPreferredCity] = useState<string | null>(profile?.preferredCity ?? null);
  const [vereniging, setVereniging] = useState<string | null>(profile?.vereniging ?? null);

  const submitAbout = useSubmitAbout();

  function handleSubmit() {
    if (!gender || !studyProgram.trim() || !preferredCity) {
      Alert.alert(tOnboarding('errors.requiredFields'));
      return;
    }
    submitAbout.mutate(
      {
        gender,
        birthDate: toISODate(birthDate),
        studyProgram: studyProgram.trim(),
        studyLevel: studyLevel || undefined,
        preferredCity,
        vereniging: vereniging || undefined,
      },
      { onSuccess: onNext, onError: () => Alert.alert(tErrors('generic')) }
    );
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <ScrollView
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('gender')}
        </ThemedText>
        <ChipPicker
          values={Gender.values}
          selected={gender}
          onSelect={setGender}
          translateKey="gender"
          t={tEnums}
        />
        {gender === Gender.prefer_not_to_say && (
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            {tOnboarding('genderPreferNotToSayHint')}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('birthDate')}
        </ThemedText>
        <DatePickerSheet
          value={birthDate}
          onChange={setBirthDate}
          title={t('birthDate')}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('studyProgram')}
        </ThemedText>
        <ThemedInput
          value={studyProgram}
          onChangeText={setStudyProgram}
          placeholder={tPlaceholders('studyProgram')}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('studyLevel')}
        </ThemedText>
        <ChipPicker
          values={StudyLevel.values}
          selected={studyLevel}
          onSelect={setStudyLevel}
          translateKey="study_level"
          t={tEnums}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('preferredCity')}
        </ThemedText>
        <CitySearchInput
          value={preferredCity ?? ''}
          onSelect={setPreferredCity}
          placeholder={tPlaceholders('preferredCity')}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('vereniging')}{' '}
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            ({tCommon('optional')})
          </ThemedText>
        </ThemedText>
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
    paddingBottom: 32,
  },
  field: {
    gap: 8,
  },
});
