import { StudyLevel } from '@openhospi/shared/enums';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ChipPicker } from '@/components/chip-picker';
import { ThemedButton } from '@/components/primitives/themed-button';
import { useTheme } from '@/design';
import { hapticFormSubmitError, hapticFormSubmitSuccess } from '@/lib/haptics';
import { useProfile, useUpdateProfile } from '@/services/profile';
import { useTranslation } from 'react-i18next';

export default function EditStudyLevelScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [studyLevel, setStudyLevel] = useState<string | null>(profile?.studyLevel ?? null);

  function handleSave() {
    updateProfile.mutate(
      { studyLevel: studyLevel || undefined },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          router.back();
        },
        onError: () => {
          hapticFormSubmitError();
          Alert.alert('Error');
        },
      }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: headerHeight + 16 }]}>
        <ChipPicker
          values={StudyLevel.values}
          selected={studyLevel}
          onSelect={(v) => setStudyLevel(v)}
          translateKey="study_level"
          t={tEnums}
        />
      </View>

      <View style={styles.footer}>
        <ThemedButton onPress={handleSave} disabled={updateProfile.isPending}>
          {tCommon('save')}
        </ThemedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
