import { Platform } from 'react-native';

import { useTheme } from '@/design';
import { hapticToggle } from '@/lib/haptics';

interface NativeToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  haptic?: boolean;
}

function NativeToggle({
  value,
  onValueChange,
  disabled = false,
  haptic = true,
}: NativeToggleProps) {
  const { colors } = useTheme();

  const handleChange = (newValue: boolean) => {
    if (haptic) hapticToggle();
    onValueChange(newValue);
  };

  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, Toggle } = require('@expo/ui/swift-ui');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { tint, disabled: disabledMod } = require('@expo/ui/swift-ui/modifiers');

    const modifiers = [tint(colors.primary)];
    if (disabled) modifiers.push(disabledMod(true));

    return (
      <Host matchContents>
        <Toggle value={value} onValueChange={handleChange} modifiers={modifiers} />
      </Host>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, Switch } = require('@expo/ui/jetpack-compose');

  return (
    <Host matchContents>
      <Switch checked={value} onCheckedChange={handleChange} enabled={!disabled} />
    </Host>
  );
}

export { NativeToggle };
export type { NativeToggleProps };
