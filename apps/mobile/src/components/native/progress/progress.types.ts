import type {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
  ViewStyle,
} from 'react-native';

export interface NativeProgressProps {
  /** Progress value from 0 to 1. Omit for indeterminate. */
  value?: number | null;
  style?: ViewStyle;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}
