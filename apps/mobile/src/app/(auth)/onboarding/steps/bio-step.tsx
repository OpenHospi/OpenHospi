import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useSubmitBio } from '@/services/onboarding';

type Props = { onNext: () => void };

export default function BioStep({ onNext }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [bio, setBio] = useState('');
  const submitBio = useSubmitBio();

  function handleSubmit() {
    submitBio.mutate(
      { bio: bio.trim() },
      { onSuccess: onNext, onError: () => Alert.alert('Error saving bio') }
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
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

      <View style={{ gap: 12 }}>
        <Button onPress={handleSubmit} disabled={submitBio.isPending}>
          <Text>{tCommon('next')}</Text>
        </Button>
        <Button variant="ghost" onPress={onNext}>
          <Text>{tCommon('skip')}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
