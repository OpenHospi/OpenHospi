import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useTranslations } from '@/i18n';
import { useSubmitLanguages } from '@/services/onboarding';

type Props = { onNext: () => void };

export default function LanguagesStep({ onNext }: Props) {
  const t = useTranslations('app.onboarding');
  const tEnums = useTranslations('enums.language_enum');
  const tCommon = useTranslations('common.labels');

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
      <Text className="text-sm text-muted-foreground">
        {t('languageCounter', { count: selected.length, min: MIN_LANGUAGES, max: MAX_LANGUAGES })}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {Language.values.map((lang) => {
          const isSelected = selected.includes(lang);
          return (
            <Pressable
              key={lang}
              className={`rounded-lg border px-3 py-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
              onPress={() => toggleLanguage(lang)}
            >
              <Text
                className={`text-sm ${isSelected ? 'font-semibold text-primary' : 'text-foreground'}`}
              >
                {tEnums(lang)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        className="mb-8 mt-6 items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
        onPress={handleSubmit}
        disabled={submitLanguages.isPending || selected.length < MIN_LANGUAGES}
      >
        <Text className="text-base font-semibold text-primary-foreground">{tCommon('next')}</Text>
      </Pressable>
    </ScrollView>
  );
}
