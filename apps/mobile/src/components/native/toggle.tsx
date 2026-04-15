import { Platform } from 'react-native';

import { useTheme } from '@/design';
import { hapticToggle } from '@/lib/haptics';

interface NativeToggleProps {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  haptic?: boolean;
}

function NativeToggle({
  isOn,
  onToggle,
  label,
  disabled = false,
  haptic = true,
}: NativeToggleProps) {
  const { colors } = useTheme();

  const handleChange = (newValue: boolean) => {
    if (haptic) hapticToggle();
    onToggle(newValue);
  };

  if (Platform.OS === 'ios') {
    return (
      <IOSToggle
        isOn={isOn}
        onToggle={handleChange}
        label={label}
        disabled={disabled}
        primaryColor={colors.primary}
      />
    );
  }

  return (
    <AndroidSwitch
      isOn={isOn}
      onToggle={handleChange}
      disabled={disabled}
      primaryColor={colors.primary}
    />
  );
}

function IOSToggle({
  isOn,
  onToggle,
  label,
  disabled,
  primaryColor,
}: {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled: boolean;
  primaryColor: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, Toggle } = require('@expo/ui/swift-ui');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { tint, disabled: disabledMod } = require('@expo/ui/swift-ui/modifiers');

  const modifiers = [tint(primaryColor)];
  if (disabled) modifiers.push(disabledMod(true));

  return (
    <Host matchContents>
      <Toggle isOn={isOn} onIsOnChange={onToggle} label={label} modifiers={modifiers} />
    </Host>
  );
}

function AndroidSwitch({
  isOn,
  onToggle,
  disabled,
  primaryColor,
}: {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  disabled: boolean;
  primaryColor: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, Switch } = require('@expo/ui/jetpack-compose');

  return (
    <Host matchContents>
      <Switch
        value={isOn}
        onCheckedChange={onToggle}
        enabled={!disabled}
        colors={{ checkedTrackColor: primaryColor }}
      />
    </Host>
  );
}

export { NativeToggle };
export type { NativeToggleProps };
