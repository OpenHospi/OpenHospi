import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeIcon } from '@/components/native/icon';
import { useTheme } from '@/design';

export default function PickersLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <Stack
      screenOptions={{
        presentation: 'formSheet',
        sheetGrabberVisible: true,
        sheetCornerRadius: 16,
        sheetAllowedDetents: [0.85, 1],
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tCommon('close')}
            onPress={() => router.back()}
            hitSlop={8}>
            <NativeIcon name="xmark" size={22} color={colors.tertiaryForeground} />
          </Pressable>
        ),
      }}
    />
  );
}
