import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useTranslations } from '@/i18n';
import { useSubmitPersonality } from '@/services/onboarding';

type Props = { onNext: () => void };

export default function PersonalityStep({ onNext }: Props) {
  const t = useTranslations('app.onboarding');
  const tEnums = useTranslations('enums.lifestyle_tag');
  const tCommon = useTranslations('common.labels');

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
      { onSuccess: onNext, onError: () => Alert.alert('Error saving tags') },
    );
  }

  return (
    <ScrollView className="flex-1">
      <Text className="text-sm text-muted-foreground">
        {t('tagCounter', {
          count: selected.length,
          max: MAX_LIFESTYLE_TAGS,
          min: MIN_LIFESTYLE_TAGS,
        })}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {LifestyleTag.values.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              className={`rounded-lg border px-3 py-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
              onPress={() => toggleTag(tag)}
            >
              <Text
                className={`text-sm ${isSelected ? 'font-semibold text-primary' : 'text-foreground'}`}
              >
                {tEnums(tag)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        className="mb-8 mt-6 items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
        onPress={handleSubmit}
        disabled={submitPersonality.isPending || selected.length < MIN_LIFESTYLE_TAGS}
      >
        <Text className="text-base font-semibold text-primary-foreground">{tCommon('next')}</Text>
      </Pressable>
    </ScrollView>
  );
}
