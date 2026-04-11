import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useImperativeHandle, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedTextarea } from '@/components/primitives/themed-textarea';
import { useTheme } from '@/design';
import { useSubmitBio } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';

import type { StepHandle } from '@/components/shared/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

export default function BioStep({ ref, onNext, profile }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const [bio, setBio] = useState(profile?.bio ?? '');
  const submitBio = useSubmitBio();

  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  function handleSubmit() {
    submitBio.mutate(
      { bio: bio.trim() },
      { onSuccess: onNext, onError: () => Alert.alert(tErrors('generic')) }
    );
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <View style={styles.container}>
      <ThemedText variant="subheadline" weight="500">
        {t('fields.bio')}
      </ThemedText>
      <ThemedTextarea
        value={bio}
        onChangeText={setBio}
        placeholder={t('placeholders.bio')}
        maxLength={MAX_BIO_LENGTH}
      />
      <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.counter}>
        {bio.length}/{MAX_BIO_LENGTH}
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
