import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
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

export default function EditLifestyleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.lifestyle_tag' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const { data: profile } = useProfile();
  const [selected, setSelected] = useState<string[]>(profile?.lifestyleTags ?? []);
  const updateProfile = useUpdateProfile();

  function toggle(tag: string) {
    hapticLight();
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_LIFESTYLE_TAGS) return prev;
      return [...prev, tag];
    });
  }

  function handleSave() {
    if (selected.length < MIN_LIFESTYLE_TAGS) return;
    updateProfile.mutate(
      { lifestyleTags: selected },
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
          {t('tagCounter', {
            count: selected.length,
            max: MAX_LIFESTYLE_TAGS,
            min: MIN_LIFESTYLE_TAGS,
          })}
        </ThemedText>
        <View style={styles.chipGrid}>
          {LifestyleTag.values.map((tag) => {
            const isSelected = selected.includes(tag);
            const label = tEnums(tag);
            return (
              <Pressable
                key={tag}
                accessibilityRole="checkbox"
                accessibilityLabel={label}
                accessibilityState={{ checked: isSelected }}
                onPress={() => toggle(tag)}>
                <ThemedBadge
                  variant={isSelected ? 'primary' : 'outline'}
                  label={label}
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
          disabled={updateProfile.isPending || selected.length < MIN_LIFESTYLE_TAGS}
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
