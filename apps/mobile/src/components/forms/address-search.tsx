import { type AddressResult } from '@openhospi/shared/pdok';
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
  displayValue: string;
  onSelect: (address: AddressResult) => void;
  placeholder?: string;
};

export function AddressSearchInput({ displayValue, onSelect, placeholder }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  function openPicker() {
    hapticLight();
    const callbackId = registerPickerCallback<AddressResult>(onSelect);
    router.push({
      pathname: '/(app)/(modals)/pick-address',
      params: { callbackId },
    });
  }

  return (
    <Pressable
      onPress={openPicker}
      accessibilityRole="button"
      accessibilityLabel={displayValue || placeholder || t('fields.address')}
      style={[
        styles.trigger,
        {
          borderColor: colors.input,
          backgroundColor: colors.background,
        },
      ]}>
      <ThemedText
        variant="body"
        color={displayValue ? colors.foreground : colors.tertiaryForeground}
        numberOfLines={1}>
        {displayValue || placeholder || t('fields.address')}
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
