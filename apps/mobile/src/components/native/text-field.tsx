import { Platform, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';

interface NativeTextFieldProps {
  /** Current text value */
  value?: string;
  /** Default text (iOS uses this for uncontrolled TextField) */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Text change handler */
  onChangeText?: (text: string) => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Submit handler */
  onSubmitEditing?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Multiline mode */
  multiline?: boolean;
  /** Number of lines for multiline (iOS lineLimit) */
  numberOfLines?: number;
  /** Secure text entry (password) */
  secureTextEntry?: boolean;
  /** Keyboard type */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  /** Auto-capitalize behavior */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Outer container style */
  style?: ViewStyle;
}

function NativeTextField({
  value,
  defaultValue,
  placeholder,
  onChangeText,
  onFocus,
  onBlur,
  onSubmitEditing,
  disabled = false,
  error = false,
  multiline = false,
  numberOfLines,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  autoFocus = false,
  style,
}: NativeTextFieldProps) {
  const { colors } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={style}>
        <IOSTextField
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          disabled={disabled}
          error={error}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          primaryColor={colors.primary}
          errorColor={colors.destructive}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <AndroidTextField
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChangeText={onChangeText}
        disabled={disabled}
        error={error}
        multiline={multiline}
        colors={colors}
      />
    </View>
  );
}

function IOSTextField({
  value,
  defaultValue,
  placeholder,
  onChangeText,
  onFocus,
  onBlur,
  onSubmitEditing,
  disabled,
  error,
  multiline,
  numberOfLines,
  secureTextEntry,
  autoFocus,
  primaryColor,
  errorColor,
}: {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  disabled: boolean;
  error: boolean;
  multiline: boolean;
  numberOfLines?: number;
  secureTextEntry: boolean;
  autoFocus: boolean;
  primaryColor: string;
  errorColor: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, TextField, SecureField } = require('@expo/ui/swift-ui');
  const {
    textFieldStyle,
    disabled: disabledMod,
    tint,
    border,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@expo/ui/swift-ui/modifiers');

  const modifiers = [textFieldStyle('roundedBorder'), tint(primaryColor)];
  if (disabled) modifiers.push(disabledMod(true));
  if (error) modifiers.push(border({ color: errorColor, width: 1 }));

  if (secureTextEntry) {
    return (
      <Host style={{ alignSelf: 'stretch' }}>
        <SecureField
          defaultValue={value ?? defaultValue}
          placeholder={placeholder}
          onValueChange={onChangeText}
          modifiers={modifiers}
        />
      </Host>
    );
  }

  return (
    <Host style={{ alignSelf: 'stretch' }}>
      <TextField
        defaultValue={value ?? defaultValue}
        placeholder={placeholder}
        onValueChange={onChangeText}
        modifiers={modifiers}
      />
    </Host>
  );
}

function AndroidTextField({
  value,
  defaultValue,
  placeholder,
  onChangeText,
  disabled,
  error,
  multiline,
  colors,
}: {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  disabled: boolean;
  error: boolean;
  multiline: boolean;
  colors: Record<string, string>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, OutlinedTextField } = require('@expo/ui/jetpack-compose');

  return (
    <Host style={{ alignSelf: 'stretch' }}>
      <OutlinedTextField
        value={value ?? defaultValue ?? ''}
        onValueChange={onChangeText}
        placeholder={placeholder}
        enabled={!disabled}
        isError={error}
        singleLine={!multiline}
      />
    </Host>
  );
}

export { NativeTextField };
export type { NativeTextFieldProps };
