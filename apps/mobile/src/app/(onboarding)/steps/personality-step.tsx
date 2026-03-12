import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
import { useImperativeHandle, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { useSubmitPersonality } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@/services/types';

import type { StepHandle } from '../types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

export default function PersonalityStep({ ref, onNext, profile }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.lifestyle_tag' });

  const [selected, setSelected] = useState<string[]>(profile?.lifestyleTags ?? []);
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

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, gap: 16, paddingBottom: 32 }}>
      <Text variant="muted" className="text-sm">
        {t('tagCounter', {
          count: selected.length,
          max: MAX_LIFESTYLE_TAGS,
          min: MIN_LIFESTYLE_TAGS,
        })}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
    </ScrollView>
  );
}
