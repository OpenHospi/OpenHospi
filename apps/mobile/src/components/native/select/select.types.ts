import type { AccessibilityRole, AccessibilityState, AccessibilityValue } from 'react-native';

export interface SelectOption {
  label: string;
  value: string;
}

export interface NativeSelectProps {
  /** Currently selected value */
  value?: string;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Available options */
  options: SelectOption[];
  /** Called when user selects an option */
  onValueChange: (value: string) => void;
  /** Opens a bottom sheet or picker — the parent provides this handler */
  onPress: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}
