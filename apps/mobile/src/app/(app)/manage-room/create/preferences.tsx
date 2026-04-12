import { GenderPreference, Language, LocationTag, RoomFeature } from '@openhospi/shared/enums';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MultiChipPicker } from '@/components/forms/multi-chip-picker';
import { AppBottomSheetModal, type BottomSheetModal } from '@/components/shared/bottom-sheet';
import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/native/input';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeSelect } from '@/components/native/select';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { useMyRoom, useSavePreferences } from '@/services/my-rooms';

export default function PreferencesScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
      router.push({ pathname: '/(app)/manage-room/create/photos', params: { roomId } });
    } catch {
      Alert.alert(t('status.draftSaved'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="80%" height={12} />
        <ThemedSkeleton width="100%" height={80} rounded="lg" />
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={80} rounded="lg" />
        <ThemedSkeleton width="40%" height={16} />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
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

      <BlurBottomBar>
        <NativeButton
          label={tCommon('next')}
          onPress={handleNext}
          loading={savePreferences.isPending}
        />
      </BlurBottomBar>

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
  loadingContainer: { flex: 1, padding: 16, gap: 12 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },
  fieldGroup: { gap: 8 },
  rowFields: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  pickerContent: { paddingHorizontal: 16, paddingVertical: 8 },
  pickerRow: { borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12 },
});
