import { Vereniging } from '@openhospi/shared/enums';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditVerenigingScreen() {
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.vereniging' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tPlaceholders } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.placeholders',
  });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState<string | null>(profile?.vereniging ?? null);
  const [search, setSearch] = useState('');

  const filtered = Vereniging.values.filter((v) => {
    if (!search.trim()) return true;
    const label = tEnums(v);
    return label.toLowerCase().includes(search.trim().toLowerCase());
  });

  function handleSave() {
    updateProfile.mutate(
      { vereniging: selected || undefined },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View style={{ paddingHorizontal: 16, paddingTop: headerHeight + 12 }}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={tPlaceholders('searchVereniging')}
          autoFocus
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected = item === selected;
          return (
            <Pressable
              onPress={() => setSelected(isSelected ? null : item)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 10,
              }}
              className={isSelected ? 'bg-primary/10' : ''}>
              <Text className={isSelected ? 'text-primary font-semibold' : 'text-foreground'}>
                {tEnums(item)}
              </Text>
            </Pressable>
          );
        }}
      />

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
