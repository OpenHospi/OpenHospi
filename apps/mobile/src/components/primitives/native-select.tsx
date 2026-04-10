import React from 'react';
import { Platform, Pressable, View, type ViewStyle } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { ThemedText } from './themed-text';
import { hapticLight } from '@/lib/haptics';

interface SelectOption {
  label: string;
  value: string;
}

interface NativeSelectProps {
  /** Currently selected value */
  value?: string;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Available options */
  options: SelectOption[];
  /** Called when user selects an option */
  onValueChange: (value: string) => void;
  /** Opens a bottom sheet or picker — the parent provides this handler */
  onPress: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
}

/**
 * Native select trigger that opens a bottom sheet or picker on press.
 *
 * This component renders the trigger only. The actual picker/sheet
 * is handled by the parent screen (using AppBottomSheetModal, DateTimePicker,
 * or a custom picker sheet). This pattern matches how native iOS apps handle
 * selection — the trigger looks like a form field, and tapping it opens
 * a native sheet.
 */
function NativeSelect({
  value,
  placeholder,
  options,
  onPress,
  disabled,
  error,
}: NativeSelectProps) {
  const { colors, typography } = useTheme();

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const triggerStyle: ViewStyle = {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryBackground,
    borderWidth: Platform.select({ ios: 0.5, android: 1 })!,
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
      accessibilityRole="button"
      accessibilityLabel={selectedLabel ?? placeholder}
      style={(state) => [triggerStyle, state.pressed && Platform.OS === 'ios' && { opacity: 0.7 }]}>
      <ThemedText
        variant="body"
        color={selectedLabel ? colors.foreground : colors.tertiaryForeground}>
        {selectedLabel ?? placeholder ?? 'Select...'}
      </ThemedText>
      <ChevronDown size={18} color={colors.tertiaryForeground} />
    </Pressable>
  );
}

export { NativeSelect };
export type { NativeSelectProps, SelectOption };
