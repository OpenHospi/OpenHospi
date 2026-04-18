import type {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
  TextInputProps,
} from 'react-native';

export interface ThemedTextareaProps extends TextInputProps {
  error?: boolean;
  minHeight?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}
