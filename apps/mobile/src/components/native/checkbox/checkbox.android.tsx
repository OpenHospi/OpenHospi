import { View } from 'react-native';
import { Host, Checkbox } from '@expo/ui/jetpack-compose';

import { useTheme } from '@/design';
import { hapticToggle } from '@/lib/haptics';

import type { ThemedCheckboxProps } from './checkbox.types';

function ThemedCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  size = 22,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
}: ThemedCheckboxProps) {
  const { colors } = useTheme();

  const handleChange = (newValue: boolean) => {
    hapticToggle();
    onCheckedChange(newValue);
  };

  return (
    <View
      style={{ width: size + 8, height: size + 8 }}
      accessibilityRole={accessibilityRole ?? 'checkbox'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, checked, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}>
      <Host matchContents>
        <Checkbox
          value={checked}
          onCheckedChange={handleChange}
          enabled={!disabled}
          colors={{
            checkedColor: colors.primary,
            uncheckedColor: colors.border,
            checkmarkColor: colors.primaryForeground,
          }}
        />
      </Host>
    </View>
  );
}

export { ThemedCheckbox };
