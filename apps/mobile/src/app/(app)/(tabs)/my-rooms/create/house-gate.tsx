import { useRouter } from 'expo-router';
import { Home, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useCreateDraft, useCreateHouse, useOwnerHouses } from '@/services/my-rooms';

export default function HouseGateScreen() {
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: houses, isLoading } = useOwnerHouses();
  const createHouse = useCreateHouse();
  const createDraft = useCreateDraft();

  const [showNewForm, setShowNewForm] = useState(false);
  const [houseName, setHouseName] = useState('');

  const handleSelectHouse = async (houseId: string) => {
    try {
      const result = await createDraft.mutateAsync(houseId);
      router.push({
        pathname: '/(app)/(tabs)/my-rooms/create/basic-info',
        params: { roomId: result.id },
      });
    } catch {
      Alert.alert(t('houseSetup.errors.createFailed'));
    }
  };

  const handleCreateHouse = async () => {
    if (houseName.trim().length < 2) {
      Alert.alert(t('houseSetup.errors.INVALID_NAME'));
      return;
    }
    try {
      const result = await createHouse.mutateAsync(houseName.trim());
      router.push({
        pathname: '/(app)/(tabs)/my-rooms/create/basic-info',
        params: { roomId: result.id },
      });
    } catch {
      Alert.alert(t('houseSetup.errors.createFailed'));
    }
  };

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  const hasHouses = houses && houses.length > 0;

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        {hasHouses && !showNewForm && (
          <>
            <Text className="text-foreground text-lg font-semibold">{t('housePicker.title')}</Text>
            <Text variant="muted" className="text-sm">
              {t('housePicker.description')}
            </Text>

            {houses.map((house) => (
              <Pressable key={house.id} onPress={() => handleSelectHouse(house.id)}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Home size={20} className="text-muted-foreground" />
                  <View style={{ flex: 1 }}>
                    <Text className="text-foreground font-semibold">{house.name}</Text>
                    <Text variant="muted" className="text-xs">
                      {t('housePicker.roomCount', { count: house.roomCount })}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}

            <Pressable onPress={() => setShowNewForm(true)}>
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: 'center',
                }}>
                <Plus size={20} className="text-primary" />
                <Text className="text-primary font-semibold">{t('housePicker.createNew')}</Text>
              </Card>
            </Pressable>
          </>
        )}

        {(!hasHouses || showNewForm) && (
          <>
            <Text className="text-foreground text-lg font-semibold">
              {t('houseSetup.form.title')}
            </Text>
            <Text variant="muted" className="text-sm">
              {t('houseSetup.form.description')}
            </Text>

            <View style={{ gap: 8 }}>
              <Label>{t('houseSetup.form.nameLabel')}</Label>
              <Input
                value={houseName}
                onChangeText={setHouseName}
                placeholder={t('houseSetup.form.namePlaceholder')}
                autoFocus
              />
            </View>

            <Button
              onPress={handleCreateHouse}
              disabled={createHouse.isPending || houseName.trim().length < 2}>
              {createHouse.isPending ? (
                <ActivityIndicator className="accent-primary-foreground" />
              ) : (
                <Text>{t('houseSetup.form.submit')}</Text>
              )}
            </Button>

            {hasHouses && (
              <Button variant="ghost" onPress={() => setShowNewForm(false)}>
                <Text>{tCommon('back')}</Text>
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
