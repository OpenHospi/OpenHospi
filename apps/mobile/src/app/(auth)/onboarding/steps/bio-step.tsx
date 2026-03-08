import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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
      { onSuccess: onNext, onError: () => Alert.alert('Error saving bio') },
    );
  }

  function handleSkip() {
    onNext();
  }

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <Text className="text-sm font-medium text-foreground">{t('fields.bio')}</Text>
      <TextInput
        className="mt-1 min-h-[120px] rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        value={bio}
        onChangeText={setBio}
        placeholder={t('placeholders.bio')}
        placeholderTextColor="#999"
        multiline
        textAlignVertical="top"
        maxLength={MAX_BIO_LENGTH}
      />
      <Text className="mt-1 text-right text-xs text-muted-foreground">
        {bio.length}/{MAX_BIO_LENGTH}
      </Text>

      <View className="mt-6 gap-3">
        <Pressable
          className="items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
          onPress={handleSubmit}
          disabled={submitBio.isPending}
        >
          <Text className="text-base font-semibold text-primary-foreground">{tCommon('next')}</Text>
        </Pressable>
        <Pressable className="items-center py-2" onPress={handleSkip}>
          <Text className="text-sm text-muted-foreground">{tCommon('skip')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
