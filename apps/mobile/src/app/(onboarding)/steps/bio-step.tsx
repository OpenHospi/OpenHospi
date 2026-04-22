import { zodResolver } from '@hookform/resolvers/zod';
import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';
import { useEffect, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ThemedText } from '@/components/native/text';
import { ThemedTextarea } from '@/components/native/textarea';
import { useTheme } from '@/design';
import { hapticFormSubmitError } from '@/lib/haptics';
import { useSubmitBio } from '@/services/onboarding';

import type { StepHandle } from '@/components/shared/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

const bioSchema = z.object({
  bio: z.string().trim().max(MAX_BIO_LENGTH),
});

type BioForm = z.infer<typeof bioSchema>;

export default function BioStep({ ref, onNext, profile }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const [formResetCounter, setFormResetCounter] = useState(0);

  const submitBio = useSubmitBio();

  const { control, handleSubmit, watch } = useForm<BioForm>({
    resolver: zodResolver(bioSchema),
    defaultValues: { bio: profile?.bio ?? '' },
  });

  useEffect(() => {
    setFormResetCounter((n) => n + 1);
  }, [profile?.bio]);

  const bioValue = watch('bio');

  function onSubmit(data: BioForm) {
    submitBio.mutate(
      { bio: data.bio.trim() },
      {
        onSuccess: onNext,
        onError: () => {
          hapticFormSubmitError();
          Alert.alert(tErrors('generic'));
        },
      }
    );
  }

  useImperativeHandle(ref, () => ({
    submit: () => void handleSubmit(onSubmit)(),
  }));

  return (
    <View style={styles.container} key={formResetCounter}>
      <ThemedText variant="subheadline" weight="500">
        {t('fields.bio')}
      </ThemedText>
      <Controller
        control={control}
        name="bio"
        render={({ field }) => (
          <ThemedTextarea
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={t('placeholders.bio')}
            maxLength={MAX_BIO_LENGTH}
            accessibilityLabel={t('fields.bio')}
          />
        )}
      />
      <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.counter}>
        {bioValue.length}/{MAX_BIO_LENGTH}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  counter: {
    textAlign: 'right',
  },
});
