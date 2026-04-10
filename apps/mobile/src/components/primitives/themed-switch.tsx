import React from 'react';
import { Switch, type SwitchProps } from 'react-native';

import { useTheme } from '@/design';
import { hapticToggle } from '@/lib/haptics';

interface ThemedSwitchProps extends Omit<
  SwitchProps,
  'trackColor' | 'thumbColor' | 'ios_backgroundColor'
> {
  /** Fires haptic feedback on toggle (default: true) */
  haptic?: boolean;
}

/**
 * Native Switch component with theme colors and built-in haptic feedback.
 * Uses the platform's native switch rendering (UISwitch on iOS, Material on Android).
 */
function ThemedSwitch({ haptic = true, onValueChange, ...props }: ThemedSwitchProps) {
  const { colors } = useTheme();

  const handleChange = (value: boolean) => {
    if (haptic) hapticToggle();
    onValueChange?.(value);
  };

  return (
    <Switch
      trackColor={{
        false: colors.muted,
        true: colors.primary,
      }}
      thumbColor="#ffffff"
      ios_backgroundColor={colors.muted}
      onValueChange={handleChange}
      {...props}
    />
  );
}

export { ThemedSwitch };
export type { ThemedSwitchProps };
