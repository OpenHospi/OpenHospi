import type { AccessibilityRole, AccessibilityState, AccessibilityValue } from 'react-native';

export interface NativeToggleProps {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  haptic?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}
