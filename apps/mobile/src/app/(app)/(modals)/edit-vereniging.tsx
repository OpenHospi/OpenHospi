import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditVerenigingScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [vereniging, setVereniging] = useState(profile?.vereniging ?? '');

  function handleSave() {
    updateProfile.mutate(
      { vereniging: vereniging.trim() || undefined },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: headerHeight + 16 }}>
        <Input value={vereniging} onChangeText={setVereniging} autoFocus />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
