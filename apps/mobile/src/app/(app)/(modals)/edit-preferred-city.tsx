import { City } from '@openhospi/shared/enums';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditPreferredCityScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [preferredCity, setPreferredCity] = useState(profile?.preferredCity ?? null);

  function handleSave() {
    updateProfile.mutate(
      { preferredCity },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: headerHeight + 16,
          paddingBottom: 16,
        }}
        keyboardShouldPersistTaps="handled">
        <ChipPicker
          values={City.values}
          selected={preferredCity}
          onSelect={(v) => setPreferredCity(v as typeof preferredCity)}
          translateKey="city"
          t={tEnums}
        />
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
