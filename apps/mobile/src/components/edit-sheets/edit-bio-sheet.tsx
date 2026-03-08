import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useState } from 'react';
import { Alert, Modal, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
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
      }
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="bg-background flex-1 p-4">
        <View className="flex-row items-center justify-between pb-4">
          <Button variant="ghost" onPress={onClose}>
            <Text>{tCommon('cancel')}</Text>
          </Button>
          <Text className="font-semibold">{t('fields.bio')}</Text>
          <Button variant="ghost" onPress={handleSave} disabled={updateProfile.isPending}>
            <Text className="text-primary">{tCommon('save')}</Text>
          </Button>
        </View>

        <Textarea
          value={bio}
          onChangeText={setBio}
          placeholder={t('placeholders.bio')}
          maxLength={MAX_BIO_LENGTH}
          numberOfLines={6}
        />
        <Text variant="muted" className="mt-1 text-right text-xs">
          {bio.length}/{MAX_BIO_LENGTH}
        </Text>
      </View>
    </Modal>
  );
}
