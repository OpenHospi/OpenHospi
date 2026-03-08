import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useSubmitPersonality } from '@/services/onboarding';

type Props = { onNext: () => void };

export default function PersonalityStep({ onNext }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.lifestyle_tag' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [selected, setSelected] = useState<string[]>([]);
  const submitPersonality = useSubmitPersonality();

  function toggleTag(tag: string) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_LIFESTYLE_TAGS) return prev;
      return [...prev, tag];
    });
  }

  function handleSubmit() {
    if (selected.length < MIN_LIFESTYLE_TAGS) {
      Alert.alert(t('validation.minTags', { min: MIN_LIFESTYLE_TAGS }));
      return;
    }
    submitPersonality.mutate(
      { lifestyleTags: selected },
      { onSuccess: onNext, onError: () => Alert.alert('Error saving tags') }
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="space-y-4 pb-8">
      <Text variant="muted" className="text-sm">
        {t('tagCounter', {
          count: selected.length,
          max: MAX_LIFESTYLE_TAGS,
          min: MIN_LIFESTYLE_TAGS,
        })}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {LifestyleTag.values.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <Pressable key={tag} onPress={() => toggleTag(tag)}>
              <Badge variant={isSelected ? 'default' : 'outline'} className="rounded-lg px-3 py-2">
                <Text>{tEnums(tag)}</Text>
              </Badge>
            </Pressable>
          );
        })}
      </View>

      <Button
        onPress={handleSubmit}
        disabled={submitPersonality.isPending || selected.length < MIN_LIFESTYLE_TAGS}>
        <Text>{tCommon('next')}</Text>
      </Button>
    </ScrollView>
  );
}
