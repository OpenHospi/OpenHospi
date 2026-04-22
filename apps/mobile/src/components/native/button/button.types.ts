import type {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
  ViewStyle,
} from 'react-native';
import type { MaterialIcons } from '@expo/vector-icons';
import type { SFSymbol } from 'sf-symbols-typescript';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface NativeButtonProps {
  /** Button label text */
  label: string;
  /** Press handler */
  onPress?: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state — disables button and shows spinner */
  loading?: boolean;
  /** SF Symbol name for iOS (e.g. 'graduationcap.fill') */
  systemImage?: SFSymbol;
  /** MaterialIcons name for Android (e.g. 'school') */
  materialIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  /** Haptic feedback on press (default: true) */
  haptic?: boolean;
  /** Outer container style (margins, etc.) */
  style?: ViewStyle;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
}
