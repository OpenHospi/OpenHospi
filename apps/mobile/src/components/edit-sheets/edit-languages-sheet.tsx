import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
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
      { onSuccess: () => onClose(), onError: () => Alert.alert('Error') }
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="bg-background flex-1">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Button variant="ghost" onPress={onClose}>
            <Text>{tCommon('cancel')}</Text>
          </Button>
          <Text className="font-semibold">{t('steps.languages')}</Text>
          <Button
            variant="ghost"
            onPress={handleSave}
            disabled={updateProfile.isPending || selected.length < MIN_LANGUAGES}>
            <Text className="text-primary">{tCommon('save')}</Text>
          </Button>
        </View>
        <Separator />

        <ScrollView className="flex-1 px-4 pt-4">
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
        </ScrollView>
      </View>
    </Modal>
  );
}
