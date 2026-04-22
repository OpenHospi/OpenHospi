import { zodResolver } from '@hookform/resolvers/zod';
import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
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
import { useSubmitPersonality } from '@/services/onboarding';

import type { StepHandle } from '@/components/shared/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

const personalitySchema = z.object({
  lifestyleTags: z.array(z.string()).min(MIN_LIFESTYLE_TAGS).max(MAX_LIFESTYLE_TAGS),
});

type PersonalityForm = z.infer<typeof personalitySchema>;

export default function PersonalityStep({ ref, onNext, profile }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.lifestyle_tag' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const [formResetCounter, setFormResetCounter] = useState(0);

  const submitPersonality = useSubmitPersonality();

  const { control, handleSubmit, watch } = useForm<PersonalityForm>({
    resolver: zodResolver(personalitySchema),
    defaultValues: { lifestyleTags: profile?.lifestyleTags ?? [] },
  });

  useEffect(() => {
    setFormResetCounter((n) => n + 1);
  }, [profile?.lifestyleTags]);

  const selected = watch('lifestyleTags');

  function onSubmit(data: PersonalityForm) {
    submitPersonality.mutate(
      { lifestyleTags: data.lifestyleTags },
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
      Alert.alert(t('validation.minTags', { min: MIN_LIFESTYLE_TAGS }));
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
        {t('tagCounter', {
          count: selected.length,
          max: MAX_LIFESTYLE_TAGS,
          min: MIN_LIFESTYLE_TAGS,
        })}
      </ThemedText>

      <Controller
        control={control}
        name="lifestyleTags"
        render={({ field }) => (
          <View style={styles.chipGrid}>
            {LifestyleTag.values.map((tag) => {
              const isSelected = field.value.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => {
                    hapticLight();
                    if (isSelected) {
                      field.onChange(field.value.filter((x) => x !== tag));
                    } else if (field.value.length < MAX_LIFESTYLE_TAGS) {
                      field.onChange([...field.value, tag]);
                    }
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={tEnums(tag)}>
                  <ThemedBadge
                    variant={isSelected ? 'primary' : 'outline'}
                    label={tEnums(tag)}
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
