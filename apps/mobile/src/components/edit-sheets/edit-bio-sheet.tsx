import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useUpdateProfile } from '@/services/profile';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialBio: string;
};

export function EditBioSheet({ visible, onClose, initialBio }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const [bio, setBio] = useState(initialBio);
  const updateProfile = useUpdateProfile();

  function handleSave() {
    updateProfile.mutate(
      { bio: bio.trim() },
      {
        onSuccess: () => onClose(),
        onError: () => Alert.alert('Error'),
      },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background p-4">
        <View className="flex-row items-center justify-between pb-4">
          <Pressable onPress={onClose}>
            <Text className="text-base text-muted-foreground">{tCommon('cancel')}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-foreground">{t('fields.bio')}</Text>
          <Pressable onPress={handleSave} disabled={updateProfile.isPending}>
            <Text className="text-base font-semibold text-primary">{tCommon('save')}</Text>
          </Pressable>
        </View>

        <TextInput
          className="min-h-[200px] rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
          value={bio}
          onChangeText={setBio}
          placeholder={t('placeholders.bio')}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          maxLength={MAX_BIO_LENGTH}
        />
        <Text className="mt-1 text-right text-xs text-muted-foreground">
          {bio.length}/{MAX_BIO_LENGTH}
        </Text>
      </View>
    </Modal>
  );
}
