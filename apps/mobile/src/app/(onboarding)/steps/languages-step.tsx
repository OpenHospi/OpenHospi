import { zodResolver } from '@hookform/resolvers/zod';
import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';
import { useEffect, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ThemedBadge } from '@/components/native/badge';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticFormSubmitError, hapticLight } from '@/lib/haptics';
import { useSubmitLanguages } from '@/services/onboarding';

import type { StepHandle } from '@/components/shared/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

const languagesSchema = z.object({
  languages: z.array(z.string()).min(MIN_LANGUAGES).max(MAX_LANGUAGES),
});

type LanguagesForm = z.infer<typeof languagesSchema>;

export default function LanguagesStep({ ref, onNext, profile }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.language_enum' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const [formResetCounter, setFormResetCounter] = useState(0);

  const submitLanguages = useSubmitLanguages();

  const { control, handleSubmit, watch } = useForm<LanguagesForm>({
    resolver: zodResolver(languagesSchema),
    defaultValues: { languages: profile?.languages ?? [] },
  });

  useEffect(() => {
    setFormResetCounter((n) => n + 1);
  }, [profile?.languages]);

  const selected = watch('languages');

  function onSubmit(data: LanguagesForm) {
    submitLanguages.mutate(
      { languages: data.languages },
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
      Alert.alert(t('validation.minLanguages', { min: MIN_LANGUAGES }));
    })();
  }

  useImperativeHandle(ref, () => ({ submit: submitWithValidation }));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      key={formResetCounter}>
      <ThemedText variant="footnote" color={colors.tertiaryForeground}>
        {t('languageCounter', {
          count: selected.length,
          min: MIN_LANGUAGES,
          max: MAX_LANGUAGES,
        })}
      </ThemedText>

      <Controller
        control={control}
        name="languages"
        render={({ field }) => (
          <View style={styles.chipGrid}>
            {Language.values.map((lang) => {
              const isSelected = field.value.includes(lang);
              return (
                <Pressable
                  key={lang}
                  onPress={() => {
                    hapticLight();
                    if (isSelected) {
                      field.onChange(field.value.filter((l) => l !== lang));
                    } else if (field.value.length < MAX_LANGUAGES) {
                      field.onChange([...field.value, lang]);
                    }
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={tEnums(lang)}>
                  <ThemedBadge
                    variant={isSelected ? 'primary' : 'outline'}
                    label={tEnums(lang)}
                    style={styles.chip}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      />
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
