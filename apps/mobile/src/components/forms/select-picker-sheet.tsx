import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { registerPickerCallback } from '@/lib/picker-callbacks';

type SelectPickerSheetProps = {
  values: readonly string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  placeholder: string;
  searchPlaceholder: string;
  /**
   * i18n key prefix used to translate each value into its display label.
   * Omit to render raw values.
   */
  translationKeyPrefix?: string;
};

export function SelectPickerSheet({
  values,
  selected,
  onSelect,
  placeholder,
  searchPlaceholder,
  translationKeyPrefix,
}: SelectPickerSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: translationKeyPrefix });

  function openPicker() {
    hapticLight();
    const callbackId = registerPickerCallback<string | null>(onSelect);
    router.push({
      pathname: '/(app)/(modals)/pick-option',
      params: {
        callbackId,
        values: JSON.stringify(values),
        current: selected ?? '',
        searchPlaceholder,
        ...(translationKeyPrefix ? { translationKeyPrefix } : {}),
      },
    });
  }

  const displayLabel = selected ? (translationKeyPrefix ? t(selected) : selected) : placeholder;

  return (
    <Pressable
      onPress={openPicker}
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
      style={[
        styles.trigger,
        {
          borderColor: colors.input,
          backgroundColor: colors.background,
        },
      ]}>
      <ThemedText
        variant="body"
        color={selected ? colors.foreground : colors.tertiaryForeground}
        numberOfLines={1}>
        {displayLabel}
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
