import { Pressable, View, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
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

  const handlePress = () => {
    hapticToggle();
    onCheckedChange(!checked);
  };

  const boxStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius.sm,
    borderWidth: checked ? 0 : 2,
    borderColor: colors.border,
    backgroundColor: checked ? colors.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'checkbox'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, checked, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={8}>
      <View style={boxStyle}>
        {checked && (
          <SymbolView
            name="checkmark"
            size={size - 8}
            tintColor={colors.primaryForeground}
            weight="bold"
          />
        )}
      </View>
    </Pressable>
  );
}

export { ThemedCheckbox };
