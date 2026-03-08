import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useUpdateProfile } from '@/services/profile';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialLanguages: string[];
};

export function EditLanguagesSheet({ visible, onClose, initialLanguages }: Props) {
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.language_enum' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const [selected, setSelected] = useState<string[]>(initialLanguages);
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
      { onSuccess: () => onClose(), onError: () => Alert.alert('Error') },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable onPress={onClose}>
            <Text className="text-base text-muted-foreground">{tCommon('cancel')}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-foreground">{t('steps.languages')}</Text>
          <Pressable
            onPress={handleSave}
            disabled={updateProfile.isPending || selected.length < MIN_LANGUAGES}
          >
            <Text className="text-base font-semibold text-primary">{tCommon('save')}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 pt-4">
          <Text className="text-sm text-muted-foreground">
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
                <Pressable
                  key={lang}
                  className={`rounded-lg border px-3 py-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
                  onPress={() => toggle(lang)}
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
        </ScrollView>
      </View>
    </Modal>
  );
}
