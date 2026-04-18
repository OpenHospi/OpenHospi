import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { registerPickerCallback } from '@/lib/picker-callbacks';

type Props = {
  value: string;
  onSelect: (cityName: string) => void;
  placeholder?: string;
};

export function CitySearchInput({ value, onSelect, placeholder }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  function openPicker() {
    hapticLight();
    const callbackId = registerPickerCallback<string>(onSelect);
    router.push({
      pathname: '/(pickers)/pick-city',
      params: { callbackId, current: value ?? '' },
    });
  }

  return (
    <Pressable
      onPress={openPicker}
      accessibilityRole="button"
      accessibilityLabel={value || placeholder || tCommon('city')}
      style={[
        styles.trigger,
        {
          borderColor: colors.input,
          backgroundColor: colors.background,
        },
      ]}>
      <ThemedText
        variant="body"
        color={value ? colors.foreground : colors.tertiaryForeground}
        numberOfLines={1}>
        {value || placeholder || tCommon('city')}
      </ThemedText>
      <NativeIcon name="chevron.right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
});
