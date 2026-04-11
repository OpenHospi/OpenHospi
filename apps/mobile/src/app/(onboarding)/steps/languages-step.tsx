import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useImperativeHandle, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';
import { useSubmitLanguages } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';

import type { StepHandle } from '@/components/shared/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

export default function LanguagesStep({ ref, onNext, profile }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.language_enum' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });

  const [selected, setSelected] = useState<string[]>(profile?.languages ?? []);
  const submitLanguages = useSubmitLanguages();

  function toggleLanguage(lang: string) {
    hapticLight();
    setSelected((prev) => {
      if (prev.includes(lang)) return prev.filter((l) => l !== lang);
      if (prev.length >= MAX_LANGUAGES) return prev;
      return [...prev, lang];
    });
  }

  function handleSubmit() {
    if (selected.length < MIN_LANGUAGES) {
      Alert.alert(t('validation.minLanguages', { min: MIN_LANGUAGES }));
      return;
    }
    submitLanguages.mutate(
      { languages: selected },
      { onSuccess: onNext, onError: () => Alert.alert(tErrors('generic')) }
    );
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <ThemedText variant="footnote" color={colors.tertiaryForeground}>
        {t('languageCounter', { count: selected.length, min: MIN_LANGUAGES, max: MAX_LANGUAGES })}
      </ThemedText>

      <View style={styles.chipGrid}>
        {Language.values.map((lang) => {
          const isSelected = selected.includes(lang);
          return (
            <Pressable key={lang} onPress={() => toggleLanguage(lang)}>
              <ThemedBadge
                variant={isSelected ? 'primary' : 'outline'}
                label={tEnums(lang)}
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
