import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditLanguagesScreen() {
  const router = useRouter();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.language_enum' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const { data: profile } = useProfile();
  const [selected, setSelected] = useState<string[]>(profile?.languages ?? []);
  const updateProfile = useUpdateProfile();

  function toggle(lang: string) {
    setSelected((prev) => {
      if (prev.includes(lang)) return prev.filter((l) => l !== lang);
      if (prev.length >= MAX_LANGUAGES) return prev;
      return [...prev, lang];
    });
  }

  function handleSave() {
    if (selected.length < MIN_LANGUAGES) return;
    updateProfile.mutate(
      { languages: selected },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View className="bg-background flex-1">
      <View className="flex-1 px-4 pt-4">
        <Text variant="muted" className="text-sm">
          {t('languageCounter', {
            count: selected.length,
            min: MIN_LANGUAGES,
            max: MAX_LANGUAGES,
          })}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {Language.values.map((lang) => {
            const isSelected = selected.includes(lang);
            return (
              <Pressable key={lang} onPress={() => toggle(lang)}>
                <Badge
                  variant={isSelected ? 'default' : 'outline'}
                  className="rounded-lg px-3 py-1.5">
                  <Text>{tEnums(lang)}</Text>
                </Badge>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="border-border border-t px-4 pt-3 pb-6">
        <Button
          className="h-14 rounded-xl"
          onPress={handleSave}
          disabled={updateProfile.isPending || selected.length < MIN_LANGUAGES}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
