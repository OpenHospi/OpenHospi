import { View } from 'react-native';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { fixedSize, tag, pickerStyle, tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

import type { NativePickerProps } from './picker.types';

function NativePicker({
  value,
  options,
  onValueChange,
  label,
  placeholder,
  style,
  variant = 'menu',
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
}: NativePickerProps) {
  const { colors } = useTheme();

  const handleChange = (newValue: string) => {
    hapticLight();
    onValueChange(newValue);
  };

  const hasMatch = options.some((o) => o.value === value);
  const effectiveOptions =
    !hasMatch && placeholder ? [{ value: '', label: placeholder }, ...options] : options;
  const selectedLabel = effectiveOptions.find((o) => o.value === value)?.label ?? placeholder ?? '';
  const styleName = variant === 'segmented' ? 'segmented' : 'menu';

  const isSegmented = variant === 'segmented';
  const menuModifiers = [pickerStyle(styleName), tint(colors.primary), fixedSize()] as never;
  const segmentedModifiers = [pickerStyle(styleName), tint(colors.primary)] as never;

  return (
    <View
      style={style}
      accessibilityRole={accessibilityRole ?? 'combobox'}
      accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue ?? { text: selectedLabel }}>
      <Host matchContents>
        <Picker
          label={label}
          selection={hasMatch ? value : ''}
          onSelectionChange={handleChange}
          modifiers={isSegmented ? segmentedModifiers : menuModifiers}>
          {effectiveOptions.map((opt) => (
            <Text key={opt.value || '__placeholder__'} modifiers={[tag(opt.value)] as never}>
              {opt.label}
            </Text>
          ))}
        </Picker>
      </Host>
    </View>
  );
}

export { NativePicker };
