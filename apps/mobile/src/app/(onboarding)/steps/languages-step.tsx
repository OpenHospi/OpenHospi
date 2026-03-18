import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useImperativeHandle, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { useSubmitLanguages } from '@/services/onboarding';
import type { ProfileWithPhotos } from '@/services/types';

import type { StepHandle } from '@/components/onboarding-types';

type Props = {
  ref?: React.Ref<StepHandle>;
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
};

export default function LanguagesStep({ ref, onNext, profile }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.language_enum' });

  const [selected, setSelected] = useState<string[]>(profile?.languages ?? []);
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
      { onSuccess: onNext, onError: () => Alert.alert('Error saving languages') }
    );
  }

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, gap: 16, paddingBottom: 32 }}>
      <Text variant="muted" className="text-sm">
        {t('languageCounter', { count: selected.length, min: MIN_LANGUAGES, max: MAX_LANGUAGES })}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
    </ScrollView>
  );
}
