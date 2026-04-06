import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CitySearchInput } from '@/components/city-search';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditPreferredCityScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tPlaceholders } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.placeholders',
  });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [city, setCity] = useState(profile?.preferredCity ?? '');

  function handleSave() {
    updateProfile.mutate(
      { preferredCity: city || null },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View style={{ paddingHorizontal: 16, paddingTop: headerHeight + 12, gap: 16 }}>
        <CitySearchInput
          value={city}
          onSelect={setCity}
          placeholder={tPlaceholders('searchCity')}
          autoFocus
        />
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
