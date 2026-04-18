import { useState } from 'react';
import { View } from 'react-native';
import {
  Host,
  DropdownMenu,
  DropdownMenuItem,
  Text,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
} from '@expo/ui/jetpack-compose';
import { clickable } from '@expo/ui/jetpack-compose/modifiers';

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
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newValue: string) => {
    hapticLight();
    onValueChange(newValue);
  };

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  if (variant === 'segmented') {
    return (
      <View
        style={style}
        accessibilityRole={accessibilityRole ?? 'tablist'}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        accessibilityValue={accessibilityValue ?? { text: selectedLabel }}>
        <Host matchContents>
          <SingleChoiceSegmentedButtonRow>
            {options.map((opt) => (
              <SegmentedButton
                key={opt.value}
                selected={opt.value === value}
                onClick={() => handleChange(opt.value)}>
                <SegmentedButton.Label>
                  <Text>{opt.label}</Text>
                </SegmentedButton.Label>
              </SegmentedButton>
            ))}
          </SingleChoiceSegmentedButtonRow>
        </Host>
      </View>
    );
  }

  return (
    <View
      style={style}
      accessibilityRole={accessibilityRole ?? 'combobox'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue ?? { text: selectedLabel }}>
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
                  handleChange(opt.value);
                  setIsOpen(false);
                }}>
                <DropdownMenuItem.Text>
                  <Text>{opt.label}</Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </View>
  );
}

export { NativePicker };
