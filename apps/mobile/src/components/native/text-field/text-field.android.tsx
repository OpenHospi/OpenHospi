import { View } from 'react-native';
import { Host, OutlinedTextField, Text } from '@expo/ui/jetpack-compose';

import type { NativeTextFieldProps } from './text-field.types';

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
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
}: NativeTextFieldProps) {
  return (
    <View
      style={style}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}>
      <Host style={{ alignSelf: 'stretch' }}>
        <OutlinedTextField
          defaultValue={defaultValue}
          onValueChange={onChangeText}
          onFocusChanged={onFocusChange}
          isError={error}
          enabled={!disabled}
          singleLine={singleLine}
          autoFocus={autoFocus}
          keyboardOptions={secureTextEntry ? { keyboardType: 'password' } : undefined}>
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
    </View>
  );
}

export { NativeTextField };
