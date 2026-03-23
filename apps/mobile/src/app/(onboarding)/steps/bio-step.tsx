import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useImperativeHandle, useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitBio } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';

import type { StepHandle } from '@/components/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

export default function BioStep({ ref, onNext, profile }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const [bio, setBio] = useState(profile?.bio ?? '');
  const submitBio = useSubmitBio();

  function handleSubmit() {
    submitBio.mutate(
      { bio: bio.trim() },
      { onSuccess: onNext, onError: () => Alert.alert('Error saving bio') }
    );
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Label>{t('fields.bio')}</Label>
      <Textarea
        value={bio}
        onChangeText={setBio}
        placeholder={t('placeholders.bio')}
        maxLength={MAX_BIO_LENGTH}
      />
      <Text variant="muted" className="text-right text-xs">
        {bio.length}/{MAX_BIO_LENGTH}
      </Text>
    </View>
  );
}
