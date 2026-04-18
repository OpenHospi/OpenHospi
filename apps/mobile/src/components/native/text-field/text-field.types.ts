import type {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
  ViewStyle,
} from 'react-native';

export interface NativeTextFieldProps {
  /** Initial/default value (uncontrolled — change `key` to reset) */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label text (displayed above/inside the field) */
  label?: string;
  /** Text change handler */
  onChangeText?: (text: string) => void;
  /** Focus change handler */
  onFocusChange?: (focused: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error/supporting message text */
  supportingText?: string;
  /** Single line mode (default: true) */
  singleLine?: boolean;
  /** Secure text entry (password) — iOS only, uses SecureField */
  secureTextEntry?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Outer container style */
  style?: ViewStyle;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}
