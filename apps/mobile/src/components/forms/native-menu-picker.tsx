import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { showActionSheet } from '@/lib/action-sheet';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';

type NativeMenuPickerProps = {
  values: readonly string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  placeholder: string;
  t: (key: string) => string;
};

export function NativeMenuPicker({
  values,
  selected,
  onSelect,
  placeholder,
  t,
}: NativeMenuPickerProps) {
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const selectedLabel = selected ? t(selected) : null;

  function handlePress() {
    showActionSheet(
      placeholder,
      values.map((v) => ({
        label: t(v),
        onPress: () => onSelect(selected === v ? null : v),
      })),
      tCommon('cancel')
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selectedLabel ?? placeholder}
      accessibilityHint={placeholder}
      accessibilityValue={selectedLabel ? { text: selectedLabel } : undefined}
      onPress={handlePress}
      style={[
        styles.trigger,
        {
          borderColor: colors.input,
          backgroundColor: colors.background,
        },
      ]}>
      <ThemedText
        variant="body"
        color={selectedLabel ? colors.foreground : colors.tertiaryForeground}>
        {selectedLabel ?? placeholder}
      </ThemedText>
      <NativeIcon name="chevron.down" size={16} color={colors.mutedForeground} />
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
