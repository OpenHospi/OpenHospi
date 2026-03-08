import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditBioScreen() {
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile } = useProfile();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const updateProfile = useUpdateProfile();

  function handleSave() {
    updateProfile.mutate(
      { bio: bio.trim() },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View className="bg-background flex-1">
      <View className="flex-1 space-y-2 px-4 pt-4">
        <Textarea
          value={bio}
          onChangeText={setBio}
          placeholder={t('placeholders.bio')}
          maxLength={MAX_BIO_LENGTH}
          numberOfLines={6}
        />
        <Text variant="muted" className="text-right text-xs">
          {bio.length}/{MAX_BIO_LENGTH}
        </Text>
      </View>

      <View className="border-border border-t px-4 pt-3 pb-6">
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
