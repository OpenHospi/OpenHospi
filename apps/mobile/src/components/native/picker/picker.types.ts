import type {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
  ViewStyle,
} from 'react-native';

export interface NativePickerProps {
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
  /** Variant (segmented only supported on Android) */
  variant?: 'menu' | 'segmented';
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}
