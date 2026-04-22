import { zodResolver } from '@hookform/resolvers/zod';
import { Gender, StudyLevel, Vereniging } from '@openhospi/shared/enums';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';
import { useEffect, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { CitySearchInput } from '@/components/forms/city-search';
import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { SelectPickerSheet } from '@/components/forms/select-picker-sheet';
import { ThemedInput } from '@/components/native/input';
import { NativePicker } from '@/components/native/picker';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { hapticFormSubmitError } from '@/lib/haptics';
import { useSubmitAbout } from '@/services/onboarding';

import type { StepHandle } from '@/components/shared/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

const aboutSchema = z.object({
  gender: z.string().min(1),
  birthDate: z.date(),
  studyProgram: z.string().trim().min(1),
  studyLevel: z.string().nullable(),
  preferredCity: z.string().min(1),
  vereniging: z.string().nullable(),
});

type AboutForm = z.infer<typeof aboutSchema>;

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
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const [formResetCounter, setFormResetCounter] = useState(0);

  const submitAbout = useSubmitAbout();

  const { control, handleSubmit, watch } = useForm<AboutForm>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      gender: profile?.gender ?? '',
      birthDate: toDateObject(profile?.birthDate),
      studyProgram: profile?.studyProgram ?? '',
      studyLevel: profile?.studyLevel ?? null,
      preferredCity: profile?.preferredCity ?? '',
      vereniging: profile?.vereniging ?? null,
    },
  });

  useEffect(() => {
    setFormResetCounter((n) => n + 1);
  }, [
    profile?.gender,
    profile?.birthDate,
    profile?.studyProgram,
    profile?.studyLevel,
    profile?.preferredCity,
    profile?.vereniging,
  ]);

  const gender = watch('gender');

  function onSubmit(data: AboutForm) {
    submitAbout.mutate(
      {
        gender: data.gender,
        birthDate: toISODate(data.birthDate),
        studyProgram: data.studyProgram.trim(),
        studyLevel: data.studyLevel ?? undefined,
        preferredCity: data.preferredCity,
        vereniging: data.vereniging ?? undefined,
      },
      {
        onSuccess: onNext,
        onError: () => {
          hapticFormSubmitError();
          Alert.alert(tErrors('generic'));
        },
      }
    );
  }

  function submitWithValidation() {
    void handleSubmit(onSubmit, () => {
      hapticFormSubmitError();
      Alert.alert(tOnboarding('errors.requiredFields'));
    })();
  }

  useImperativeHandle(ref, () => ({ submit: submitWithValidation }));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
      key={formResetCounter}>
      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('gender')}
        </ThemedText>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <NativePicker
              value={field.value ?? ''}
              options={Gender.values.map((v) => ({ value: v, label: tEnums(`gender.${v}`) }))}
              onValueChange={field.onChange}
              placeholder={t('gender')}
              label={t('gender')}
            />
          )}
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
        <Controller
          control={control}
          name="birthDate"
          render={({ field }) => (
            <DatePickerSheet
              value={field.value}
              onChange={field.onChange}
              title={t('birthDate')}
              maximumDate={new Date()}
              minimumDate={new Date(1950, 0, 1)}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('studyProgram')}
        </ThemedText>
        <Controller
          control={control}
          name="studyProgram"
          render={({ field }) => (
            <ThemedInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={tPlaceholders('studyProgram')}
              autoCapitalize="sentences"
              accessibilityLabel={t('studyProgram')}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('studyLevel')}
        </ThemedText>
        <Controller
          control={control}
          name="studyLevel"
          render={({ field }) => (
            <NativePicker
              value={field.value ?? ''}
              options={StudyLevel.values.map((v) => ({
                value: v,
                label: tEnums(`study_level.${v}`),
              }))}
              onValueChange={(v) => field.onChange(v || null)}
              placeholder={tPlaceholders('studyLevel')}
              label={t('studyLevel')}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('preferredCity')}
        </ThemedText>
        <Controller
          control={control}
          name="preferredCity"
          render={({ field }) => (
            <CitySearchInput
              value={field.value}
              onSelect={field.onChange}
              placeholder={tPlaceholders('preferredCity')}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('vereniging')}{' '}
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            ({tCommon('optional')})
          </ThemedText>
        </ThemedText>
        <Controller
          control={control}
          name="vereniging"
          render={({ field }) => (
            <SelectPickerSheet
              values={Vereniging.values}
              selected={field.value}
              onSelect={field.onChange}
              placeholder={tPlaceholders('vereniging')}
              searchPlaceholder={tPlaceholders('searchVereniging')}
              translationKeyPrefix="enums.vereniging"
            />
          )}
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
