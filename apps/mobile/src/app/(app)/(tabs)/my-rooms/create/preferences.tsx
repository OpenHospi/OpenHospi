import { GenderPreference, Language, LocationTag, RoomFeature } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MultiChipPicker } from '@/components/multi-chip-picker';
import { AppBottomSheetModal, type BottomSheetModal } from '@/components/bottom-sheet';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';
import { NativeSelect } from '@/components/primitives/native-select';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';
import { useMyRoom, useSavePreferences } from '@/services/my-rooms';

export default function PreferencesScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(roomId);
  const savePreferences = useSavePreferences();
  const genderSheetRef = useRef<BottomSheetModal>(null);

  const [features, setFeatures] = useState<string[]>([]);
  const [locationTags, setLocationTags] = useState<string[]>([]);
  const [preferredGender, setPreferredGender] = useState<string>(GenderPreference.no_preference);
  const [preferredAgeMin, setPreferredAgeMin] = useState('');
  const [preferredAgeMax, setPreferredAgeMax] = useState('');
  const [acceptedLanguages, setAcceptedLanguages] = useState<string[]>([]);
  const [roomVereniging, setRoomVereniging] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (room && !initialized) {
    setFeatures(room.features || []);
    setLocationTags(room.locationTags || []);
    setPreferredGender(room.preferredGender || GenderPreference.no_preference);
    setPreferredAgeMin(room.preferredAgeMin ? String(room.preferredAgeMin) : '');
    setPreferredAgeMax(room.preferredAgeMax ? String(room.preferredAgeMax) : '');
    setAcceptedLanguages(room.acceptedLanguages || []);
    setRoomVereniging(room.roomVereniging || '');
    setInitialized(true);
  }

  const handleNext = async () => {
    try {
      await savePreferences.mutateAsync({
        roomId,
        data: {
          features,
          locationTags,
          preferredGender: preferredGender || undefined,
          preferredAgeMin: preferredAgeMin ? Number(preferredAgeMin) : undefined,
          preferredAgeMax: preferredAgeMax ? Number(preferredAgeMax) : undefined,
          acceptedLanguages,
          roomVereniging: roomVereniging || undefined,
        },
      });
      router.push({ pathname: '/(app)/(tabs)/my-rooms/create/photos', params: { roomId } });
    } catch {
      Alert.alert(t('status.draftSaved'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <ThemedText variant="headline">{t('wizard.steps.preferences')}</ThemedText>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('wizard.stepDescriptions.step3')}
        </ThemedText>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('wizard.sections.features')}
          </ThemedText>
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('wizard.sectionDescriptions.features')}
          </ThemedText>
          <MultiChipPicker
            values={RoomFeature.values}
            selected={features}
            onToggle={setFeatures}
            translateKey="room_feature"
            t={tEnums}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.locationTags')}
          </ThemedText>
          <MultiChipPicker
            values={LocationTag.values}
            selected={locationTags}
            onToggle={setLocationTags}
            translateKey="location_tag"
            t={tEnums}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('wizard.sections.preferences')}
          </ThemedText>
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('wizard.sectionDescriptions.preferences')}
          </ThemedText>

          <NativeSelect
            value={preferredGender}
            options={GenderPreference.values.map((v: string) => ({
              value: v,
              label: tEnums(`gender_preference.${v}`),
            }))}
            onValueChange={setPreferredGender}
            onPress={() => genderSheetRef.current?.present()}
          />

          <View style={styles.rowFields}>
            <View style={styles.flex1}>
              <ThemedInput
                value={preferredAgeMin}
                onChangeText={setPreferredAgeMin}
                placeholder={t('fields.preferredAgeMin')}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <ThemedInput
                value={preferredAgeMax}
                onChangeText={setPreferredAgeMax}
                placeholder={t('fields.preferredAgeMax')}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.acceptedLanguages')}
          </ThemedText>
          <MultiChipPicker
            values={Language.values}
            selected={acceptedLanguages}
            onToggle={setAcceptedLanguages}
            translateKey="language"
            t={tEnums}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('wizard.sections.association')}
          </ThemedText>
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('wizard.sectionDescriptions.association')}
          </ThemedText>
          <ThemedInput
            value={roomVereniging}
            onChangeText={setRoomVereniging}
            placeholder={t('placeholders.searchVereniging')}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.separator, paddingBottom: Math.max(bottom, 16) },
        ]}>
        <ThemedButton onPress={handleNext} loading={savePreferences.isPending}>
          {tCommon('next')}
        </ThemedButton>
      </View>

      <AppBottomSheetModal ref={genderSheetRef} enableDynamicSizing scrollable={false}>
        <View style={styles.pickerContent}>
          {GenderPreference.values.map((v: string) => (
            <Pressable
              key={v}
              onPress={() => {
                hapticLight();
                setPreferredGender(v);
                genderSheetRef.current?.dismiss();
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              style={[
                styles.pickerRow,
                preferredGender === v ? { backgroundColor: colors.accent } : undefined,
              ]}>
              <ThemedText
                variant="body"
                weight={preferredGender === v ? '600' : '400'}
                color={preferredGender === v ? colors.primary : colors.foreground}>
                {tEnums(`gender_preference.${v}`)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </AppBottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  fieldGroup: { gap: 8 },
  rowFields: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  pickerContent: { paddingHorizontal: 16, paddingVertical: 8 },
  pickerRow: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
});
