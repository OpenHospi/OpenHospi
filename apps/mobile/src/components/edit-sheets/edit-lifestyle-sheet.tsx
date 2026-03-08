import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useUpdateProfile } from '@/services/profile';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialTags: string[];
};

export function EditLifestyleSheet({ visible, onClose, initialTags }: Props) {
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.lifestyle_tag' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const [selected, setSelected] = useState<string[]>(initialTags);
  const updateProfile = useUpdateProfile();

  function toggle(tag: string) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_LIFESTYLE_TAGS) return prev;
      return [...prev, tag];
    });
  }

  function handleSave() {
    if (selected.length < MIN_LIFESTYLE_TAGS) return;
    updateProfile.mutate(
      { lifestyleTags: selected },
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
          <Text className="text-base font-semibold text-foreground">{t('steps.personality')}</Text>
          <Pressable
            onPress={handleSave}
            disabled={updateProfile.isPending || selected.length < MIN_LIFESTYLE_TAGS}
          >
            <Text className="text-base font-semibold text-primary">{tCommon('save')}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 pt-4">
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
                  className={`rounded-lg border px-3 py-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
                  onPress={() => toggle(tag)}
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
        </ScrollView>
      </View>
    </Modal>
  );
}
