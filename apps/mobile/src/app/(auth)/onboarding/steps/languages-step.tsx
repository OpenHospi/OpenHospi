import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useSubmitLanguages } from '@/services/onboarding';

type Props = { onNext: () => void };

export default function LanguagesStep({ onNext }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.language_enum' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [selected, setSelected] = useState<string[]>([]);
  const submitLanguages = useSubmitLanguages();

  function toggleLanguage(lang: string) {
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
      { onSuccess: onNext, onError: () => Alert.alert('Error saving languages') },
    );
  }

  return (
    <ScrollView className="flex-1">
      <Text variant="muted">
        {t('languageCounter', { count: selected.length, min: MIN_LANGUAGES, max: MAX_LANGUAGES })}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {Language.values.map((lang) => {
          const isSelected = selected.includes(lang);
          return (
            <Pressable key={lang} onPress={() => toggleLanguage(lang)}>
              <Badge variant={isSelected ? 'default' : 'outline'} className="rounded-lg px-3 py-2">
                <Text>{tEnums(lang)}</Text>
              </Badge>
            </Pressable>
          );
        })}
      </View>

      <Button
        className="mb-8 mt-6"
        onPress={handleSubmit}
        disabled={submitLanguages.isPending || selected.length < MIN_LANGUAGES}
      >
        <Text>{tCommon('next')}</Text>
      </Button>
    </ScrollView>
  );
}
