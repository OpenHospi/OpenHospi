import { useRouter } from 'expo-router';
import { Home, Plus } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';
import { useCreateDraft, useCreateHouse, useOwnerHouses } from '@/services/my-rooms';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
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

          {houses.map((house) => (
            <Pressable
              key={house.id}
              onPress={() => {
                hapticLight();
                handleSelectHouse(house.id);
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={({ pressed }) => [
                pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
              ]}>
              <GroupedSection>
                <View style={styles.houseRow}>
                  <Home size={20} color={colors.tertiaryForeground} />
                  <View style={styles.houseInfo}>
                    <ThemedText variant="headline">{house.name}</ThemedText>
                    <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                      {t('housePicker.roomCount', { count: house.roomCount })}
                    </ThemedText>
                  </View>
                </View>
              </GroupedSection>
            </Pressable>
          ))}

          <Pressable
            onPress={() => {
              hapticLight();
              setShowNewForm(true);
            }}>
            <GroupedSection>
              <View style={styles.createRow}>
                <Plus size={20} color={colors.primary} />
                <ThemedText variant="headline" color={colors.primary}>
                  {t('housePicker.createNew')}
                </ThemedText>
              </View>
            </GroupedSection>
          </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  houseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  houseInfo: {
    flex: 1,
    gap: 2,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    padding: 16,
  },
  fieldGroup: {
    gap: 8,
  },
});
