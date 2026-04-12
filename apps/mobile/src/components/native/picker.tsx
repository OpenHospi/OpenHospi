import { useState } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

interface NativePickerProps {
  /** Currently selected value */
  value: string;
  /** Available options */
  options: { label: string; value: string }[];
  /** Selection change handler */
  onValueChange: (value: string) => void;
  /** Label displayed above/beside picker */
  label?: string;
  /** Outer container style */
  style?: ViewStyle;
}

function NativePicker({ value, options, onValueChange, label, style }: NativePickerProps) {
  const { colors } = useTheme();

  const handleChange = (newValue: string) => {
    hapticLight();
    onValueChange(newValue);
  };

  if (Platform.OS === 'ios') {
    return (
      <IOSPicker
        value={value}
        options={options}
        onValueChange={handleChange}
        label={label}
        primaryColor={colors.primary}
        style={style}
      />
    );
  }

  return (
    <AndroidPicker
      value={value}
      options={options}
      onValueChange={handleChange}
      label={label}
      style={style}
    />
  );
}

function IOSPicker({
  value,
  options,
  onValueChange,
  label,
  primaryColor,
  style,
}: {
  value: string;
  options: { label: string; value: string }[];
  onValueChange: (value: string) => void;
  label?: string;
  primaryColor: string;
  style?: ViewStyle;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, Picker, Text } = require('@expo/ui/swift-ui');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tag, pickerStyle, tint } = require('@expo/ui/swift-ui/modifiers');

  return (
    <View style={style}>
      <Host matchContents>
        <Picker
          label={label}
          selection={value}
          onSelectionChange={onValueChange}
          modifiers={[pickerStyle('menu'), tint(primaryColor)]}>
          {options.map((opt) => (
            <Text key={opt.value} modifiers={[tag(opt.value)]}>
              {opt.label}
            </Text>
          ))}
        </Picker>
      </Host>
    </View>
  );
}

function AndroidPicker({ value, options, onValueChange, label, style }: NativePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    Host,
    DropdownMenu,
    DropdownMenuItem,
    Text,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@expo/ui/jetpack-compose');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { clickable } = require('@expo/ui/jetpack-compose/modifiers');

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <View style={style}>
      <Host matchContents>
        <DropdownMenu expanded={isOpen} onDismissRequest={() => setIsOpen(false)}>
          <DropdownMenu.Trigger>
            <Text modifiers={[clickable(() => setIsOpen(true))]}>{selectedLabel}</Text>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {options.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  onValueChange(opt.value);
                  setIsOpen(false);
                }}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </View>
  );
}

export { NativePicker };
export type { NativePickerProps };
