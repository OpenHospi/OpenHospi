import { View } from 'react-native';
import { Host, Toggle } from '@expo/ui/swift-ui';
import { tint, disabled as disabledMod } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/design';
import { hapticToggle } from '@/lib/haptics';

import type { NativeToggleProps } from './toggle.types';

function NativeToggle({
  isOn,
  onToggle,
  label,
  disabled = false,
  haptic = true,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
}: NativeToggleProps) {
  const { colors } = useTheme();

  const handleChange = (newValue: boolean) => {
    if (haptic) hapticToggle();
    onToggle(newValue);
  };

  const modifiers: unknown[] = [tint(colors.primary)];
  if (disabled) modifiers.push(disabledMod(true));

  return (
    <View
      accessibilityRole={accessibilityRole ?? 'switch'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, checked: isOn, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}>
      <Host matchContents>
        <Toggle
          isOn={isOn}
          onIsOnChange={handleChange}
          label={label}
          modifiers={modifiers as never}
        />
      </Host>
    </View>
  );
}

export { NativeToggle };
