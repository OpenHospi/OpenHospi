import { LOCALE_CONFIG, SUPPORTED_LOCALES } from '@openhospi/i18n';
import { Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeIcon } from '@/components/native/icon';
import { useTheme } from '@/design';
import { showActionSheet } from '@/lib/action-sheet';
import { hapticLight } from '@/lib/haptics';

function LanguageHeaderPicker() {
  const { i18n, t } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        showActionSheet(
          t('language'),
          SUPPORTED_LOCALES.map((loc) => ({
            label: LOCALE_CONFIG[loc].name,
            onPress: () => {
              void i18n.changeLanguage(loc);
            },
          })),
          t('cancel')
        );
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('language')}>
      <NativeIcon name="globe" size={22} color={colors.primary} />
    </Pressable>
  );
}

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: '',
        headerTransparent: true,
        headerShadowVisible: false,
        headerRight: () => <LanguageHeaderPicker />,
      }}
    />
  );
}
