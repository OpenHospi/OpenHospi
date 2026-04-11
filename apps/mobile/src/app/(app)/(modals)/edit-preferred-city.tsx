import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CitySearchInput } from '@/components/forms/city-search';
import { ThemedButton } from '@/components/primitives/themed-button';
import { useTheme } from '@/design';
import { hapticFormSubmitError, hapticFormSubmitSuccess } from '@/lib/haptics';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditPreferredCityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tErrors } = useTranslation('translation', { keyPrefix: 'common.errors' });
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
        onSuccess: () => {
          hapticFormSubmitSuccess();
          router.back();
        },
        onError: () => {
          hapticFormSubmitError();
          Alert.alert(tErrors('generic'));
        },
      }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchArea, { paddingTop: headerHeight + 12 }]}>
        <CitySearchInput
          value={city}
          onSelect={setCity}
          placeholder={tPlaceholders('searchCity')}
        />
      </View>

      <View style={styles.spacer} />

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
  searchArea: {
    paddingHorizontal: 16,
    gap: 16,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
