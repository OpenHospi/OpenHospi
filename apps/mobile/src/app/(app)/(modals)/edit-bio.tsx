import { MAX_BIO_LENGTH } from '@openhospi/shared/constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/native/text';
import { ThemedTextarea } from '@/components/primitives/themed-textarea';
import { useTheme } from '@/design';
import { hapticFormSubmitError, hapticFormSubmitSuccess } from '@/lib/haptics';
import { useProfile, useUpdateProfile } from '@/services/profile';
import { useTranslation } from 'react-i18next';

export default function EditBioScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile } = useProfile();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const updateProfile = useUpdateProfile();

  function handleSave() {
    updateProfile.mutate(
      { bio: bio.trim() },
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
      <View style={styles.content}>
        <ThemedTextarea
          value={bio}
          onChangeText={setBio}
          placeholder={t('placeholders.bio')}
          maxLength={MAX_BIO_LENGTH}
          numberOfLines={6}
        />
        <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.counter}>
          {bio.length}/{MAX_BIO_LENGTH}
        </ThemedText>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  counter: {
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
