import { Pressable, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { ThemedText } from '@/components/native/text';
import { hapticLight } from '@/lib/haptics';

import type { NativeSelectProps } from './select.types';

function NativeSelect({
  value,
  placeholder,
  options,
  onPress,
  disabled,
  error,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
}: NativeSelectProps) {
  const { colors } = useTheme();

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const triggerStyle: ViewStyle = {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryBackground,
    borderWidth: 0.5,
    borderColor: error ? colors.destructive : colors.separator,
    opacity: disabled ? 0.5 : 1,
  };

  const handlePress = () => {
    hapticLight();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? 'combobox'}
      accessibilityLabel={accessibilityLabel ?? selectedLabel ?? placeholder}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue ?? { text: selectedLabel ?? placeholder ?? '' }}
      style={(state) => [triggerStyle, state.pressed && { opacity: 0.7 }]}>
      <ThemedText
        variant="body"
        color={selectedLabel ? colors.foreground : colors.tertiaryForeground}>
        {selectedLabel ?? placeholder ?? 'Select...'}
      </ThemedText>
      <SymbolView name="chevron.down" size={18} tintColor={colors.tertiaryForeground} />
    </Pressable>
  );
}

export { NativeSelect };
