import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
import { useImperativeHandle, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';
import { useSubmitPersonality } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';

import type { StepHandle } from '@/components/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

export default function PersonalityStep({ ref, onNext, profile }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.lifestyle_tag' });

  const [selected, setSelected] = useState<string[]>(profile?.lifestyleTags ?? []);
  const submitPersonality = useSubmitPersonality();

  function toggleTag(tag: string) {
    hapticLight();
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
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <ThemedText variant="footnote" color={colors.tertiaryForeground}>
        {t('tagCounter', {
          count: selected.length,
          max: MAX_LIFESTYLE_TAGS,
          min: MIN_LIFESTYLE_TAGS,
        })}
      </ThemedText>

      <View style={styles.chipGrid}>
        {LifestyleTag.values.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <Pressable key={tag} onPress={() => toggleTag(tag)}>
              <ThemedBadge
                variant={isSelected ? 'primary' : 'outline'}
                label={tEnums(tag)}
                style={styles.chip}
              />
            </Pressable>
          );
        })}
      </View>
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
