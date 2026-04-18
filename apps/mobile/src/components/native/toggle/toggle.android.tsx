import { View } from 'react-native';
import { Host, Switch } from '@expo/ui/jetpack-compose';

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

  return (
    <View
      accessibilityRole={accessibilityRole ?? 'switch'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, checked: isOn, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}>
      <Host matchContents>
        <Switch
          value={isOn}
          onCheckedChange={handleChange}
          enabled={!disabled}
          colors={{ checkedTrackColor: colors.primary }}
        />
      </Host>
    </View>
  );
}

export { NativeToggle };
