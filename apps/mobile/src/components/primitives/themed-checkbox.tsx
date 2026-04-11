import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticToggle } from '@/lib/haptics';

interface ThemedCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: number;
}

function ThemedCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  size = 22,
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
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={8}>
      <View style={boxStyle}>
        {checked && <Check size={size - 6} color={colors.primaryForeground} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

export { ThemedCheckbox };
export type { ThemedCheckboxProps };
