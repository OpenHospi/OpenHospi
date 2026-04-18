import { useRouter } from 'expo-router';
import { Home, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { ListSeparator } from '@/components/layout/list-separator';
import { useTheme } from '@/design';
import { useCreateDraft, useCreateHouse, useOwnerHouses } from '@/services/my-rooms';

function SkeletonHouseGate() {
  return (
    <View style={styles.skeletonContainer}>
      <ThemedSkeleton width="60%" height={20} />
      <ThemedSkeleton width="80%" height={14} />
      <ThemedSkeleton width="100%" height={60} rounded="lg" />
      <ThemedSkeleton width="100%" height={60} rounded="lg" />
      <ThemedSkeleton width="100%" height={48} rounded="lg" />
    </View>
  );
}

export default function HouseGateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
        pathname: '/(app)/my-rooms/create/basic-info',
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
        pathname: '/(app)/my-rooms/create/basic-info',
        params: { roomId: result.id },
      });
    } catch {
      Alert.alert(t('houseSetup.errors.createFailed'));
    }
  };

  if (isLoading) {
    return <SkeletonHouseGate />;
  }

  const hasHouses = houses && houses.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      {hasHouses && !showNewForm && (
        <>
          <ThemedText variant="headline">{t('housePicker.title')}</ThemedText>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('housePicker.description')}
          </ThemedText>

          <GroupedSection>
            {houses.map((house, index) => (
              <View key={house.id}>
                {index > 0 && <ListSeparator />}
                <ListCell
                  label={house.name}
                  value={t('housePicker.roomCount', { count: house.roomCount })}
                  leftContent={<Home size={20} color={colors.tertiaryForeground} />}
                  onPress={() => handleSelectHouse(house.id)}
                />
              </View>
            ))}
            <ListSeparator />
            <ListCell
              label={t('housePicker.createNew')}
              leftContent={<Plus size={20} color={colors.primary} />}
              onPress={() => setShowNewForm(true)}
            />
          </GroupedSection>
        </>
      )}

      {(!hasHouses || showNewForm) && (
        <>
          <ThemedText variant="headline">{t('houseSetup.form.title')}</ThemedText>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('houseSetup.form.description')}
          </ThemedText>

          <View style={styles.fieldGroup}>
            <ThemedText variant="subheadline" weight="500">
              {t('houseSetup.form.nameLabel')}
            </ThemedText>
            <ThemedInput
              value={houseName}
              onChangeText={setHouseName}
              placeholder={t('houseSetup.form.namePlaceholder')}
              autoFocus
            />
          </View>

          <ThemedButton
            onPress={handleCreateHouse}
            loading={createHouse.isPending}
            disabled={houseName.trim().length < 2}>
            {t('houseSetup.form.submit')}
          </ThemedButton>

          {hasHouses && (
            <ThemedButton variant="ghost" onPress={() => setShowNewForm(false)}>
              {tCommon('back')}
            </ThemedButton>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  fieldGroup: {
    gap: 8,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
});
