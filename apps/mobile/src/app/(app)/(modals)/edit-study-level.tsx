import { StudyLevel } from '@openhospi/shared/enums';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditStudyLevelScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [studyLevel, setStudyLevel] = useState(profile?.studyLevel ?? null);

  function handleSave() {
    updateProfile.mutate(
      { studyLevel: studyLevel || undefined },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: headerHeight + 16 }}>
        <ChipPicker
          values={StudyLevel.values}
          selected={studyLevel}
          onSelect={(v) => setStudyLevel(v as typeof studyLevel)}
          translateKey="study_level"
          t={tEnums}
        />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
