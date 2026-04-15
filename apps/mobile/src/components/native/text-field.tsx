import { Platform, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';

interface NativeTextFieldProps {
  /** Initial/default value (iOS is uncontrolled, use key to reset) */
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
}

function NativeTextField({
  defaultValue,
  placeholder,
  label,
  onChangeText,
  onFocusChange,
  disabled = false,
  error = false,
  supportingText,
  singleLine = true,
  secureTextEntry = false,
  autoFocus = false,
  style,
}: NativeTextFieldProps) {
  const { colors } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={style}>
        <IOSTextField
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChangeText={onChangeText}
          onFocusChange={onFocusChange}
          disabled={disabled}
          error={error}
          singleLine={singleLine}
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        label={label}
        onChangeText={onChangeText}
        disabled={disabled}
        error={error}
        supportingText={supportingText}
        singleLine={singleLine}
      />
    </View>
  );
}

// ── iOS: SwiftUI TextField (uncontrolled) ────────────────────

function IOSTextField({
  defaultValue,
  placeholder,
  onChangeText,
  onFocusChange,
  disabled,
  error,
  singleLine,
  secureTextEntry,
  autoFocus,
  primaryColor,
  errorColor,
}: {
  defaultValue?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
  disabled: boolean;
  error: boolean;
  singleLine: boolean;
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
          defaultValue={defaultValue}
          placeholder={placeholder}
          onValueChange={onChangeText}
          autoFocus={autoFocus}
          modifiers={modifiers}
        />
      </Host>
    );
  }

  return (
    <Host style={{ alignSelf: 'stretch' }}>
      <TextField
        defaultValue={defaultValue}
        placeholder={placeholder}
        onValueChange={onChangeText}
        onFocusChange={onFocusChange}
        autoFocus={autoFocus}
        axis={singleLine ? 'horizontal' : 'vertical'}
        modifiers={modifiers}
      />
    </Host>
  );
}

// ── Android: Jetpack Compose OutlinedTextField ───────────────

function AndroidTextField({
  defaultValue,
  placeholder,
  label,
  onChangeText,
  disabled,
  error,
  supportingText,
  singleLine,
}: {
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  onChangeText?: (text: string) => void;
  disabled: boolean;
  error: boolean;
  supportingText?: string;
  singleLine: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, OutlinedTextField, Text } = require('@expo/ui/jetpack-compose');

  return (
    <Host style={{ alignSelf: 'stretch' }}>
      <OutlinedTextField
        onValueChange={onChangeText}
        isError={error}
        enabled={!disabled}
        singleLine={singleLine}>
        {label && (
          <OutlinedTextField.Label>
            <Text>{label}</Text>
          </OutlinedTextField.Label>
        )}
        {placeholder && (
          <OutlinedTextField.Placeholder>
            <Text>{placeholder}</Text>
          </OutlinedTextField.Placeholder>
        )}
        {supportingText && (
          <OutlinedTextField.SupportingText>
            <Text>{supportingText}</Text>
          </OutlinedTextField.SupportingText>
        )}
      </OutlinedTextField>
    </Host>
  );
}

export { NativeTextField };
export type { NativeTextFieldProps };
