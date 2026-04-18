import { View } from 'react-native';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { tag, pickerStyle, tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

import type { NativePickerProps } from './picker.types';

function NativePicker({
  value,
  options,
  onValueChange,
  label,
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

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';
  const styleName = variant === 'segmented' ? 'segmented' : 'menu';

  return (
    <View
      style={style}
      accessibilityRole={accessibilityRole ?? 'combobox'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue ?? { text: selectedLabel }}>
      <Host matchContents>
        <Picker
          label={label}
          selection={value}
          onSelectionChange={handleChange}
          modifiers={[pickerStyle(styleName), tint(colors.primary)] as never}>
          {options.map((opt) => (
            <Text key={opt.value} modifiers={[tag(opt.value)] as never}>
              {opt.label}
            </Text>
          ))}
        </Picker>
      </Host>
    </View>
  );
}

export { NativePicker };
