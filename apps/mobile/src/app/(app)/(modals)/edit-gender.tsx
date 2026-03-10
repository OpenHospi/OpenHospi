import { Gender } from '@openhospi/shared/enums';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditGenderScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tOnboarding } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [gender, setGender] = useState(profile?.gender ?? null);

  function handleSave() {
    updateProfile.mutate(
      { gender },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: headerHeight + 16, gap: 12 }}>
        <ChipPicker
          values={Gender.values}
          selected={gender}
          onSelect={setGender}
          translateKey="gender"
          t={tEnums}
        />
        {gender === Gender.prefer_not_to_say && (
          <Text variant="muted" className="text-sm">
            {tOnboarding('genderPreferNotToSayHint')}
          </Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
