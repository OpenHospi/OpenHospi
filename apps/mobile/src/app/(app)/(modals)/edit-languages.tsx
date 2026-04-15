import { MAX_LANGUAGES, MIN_LANGUAGES } from '@openhospi/shared/constants';
import { Language } from '@openhospi/shared/enums';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticFormSubmitError, hapticFormSubmitSuccess, hapticLight } from '@/lib/haptics';
import { useProfile, useUpdateProfile } from '@/services/profile';
import { useTranslation } from 'react-i18next';

export default function EditLanguagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.language_enum' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const { data: profile } = useProfile();
  const [selected, setSelected] = useState<string[]>(profile?.languages ?? []);
  const updateProfile = useUpdateProfile();

  function toggle(lang: string) {
    hapticLight();
    setSelected((prev) => {
      if (prev.includes(lang)) return prev.filter((l) => l !== lang);
      if (prev.length >= MAX_LANGUAGES) return prev;
      return [...prev, lang];
    });
  }

  function handleSave() {
    if (selected.length < MIN_LANGUAGES) return;
    updateProfile.mutate(
      { languages: selected },
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
        <ThemedText variant="footnote" color={colors.tertiaryForeground}>
          {t('languageCounter', {
            count: selected.length,
            min: MIN_LANGUAGES,
            max: MAX_LANGUAGES,
          })}
        </ThemedText>
        <View style={styles.chipGrid}>
          {Language.values.map((lang) => {
            const isSelected = selected.includes(lang);
            return (
              <Pressable key={lang} onPress={() => toggle(lang)}>
                <ThemedBadge
                  variant={isSelected ? 'primary' : 'outline'}
                  label={tEnums(lang)}
                  style={styles.chip}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <NativeButton
          label={tCommon('save')}
          onPress={handleSave}
          disabled={updateProfile.isPending || selected.length < MIN_LANGUAGES}
        />
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
    paddingTop: 16,
  },
  chipGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
