import { View } from 'react-native';
import { Host, TextField, SecureField } from '@expo/ui/swift-ui';
import { textFieldStyle, tint, border, disabled as disabledMod } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/design';

import type { NativeTextFieldProps } from './text-field.types';

function NativeTextField({
  defaultValue,
  placeholder,
  onChangeText,
  onFocusChange,
  disabled = false,
  error = false,
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
  const { colors } = useTheme();

  const modifiers: unknown[] = [textFieldStyle('roundedBorder'), tint(colors.primary)];
  if (disabled) modifiers.push(disabledMod(true));
  if (error) modifiers.push(border({ color: colors.destructive, width: 1 }));

  return (
    <View
      style={style}
      accessibilityRole={accessibilityRole ?? (secureTextEntry ? 'none' : 'none')}
      accessibilityLabel={accessibilityLabel ?? placeholder}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}>
      <Host style={{ alignSelf: 'stretch' }}>
        {secureTextEntry ? (
          <SecureField
            defaultValue={defaultValue}
            placeholder={placeholder}
            onValueChange={onChangeText}
            onFocusChange={onFocusChange}
            autoFocus={autoFocus}
            modifiers={modifiers as never}
          />
        ) : (
          <TextField
            defaultValue={defaultValue}
            placeholder={placeholder}
            onValueChange={onChangeText}
            onFocusChange={onFocusChange}
            autoFocus={autoFocus}
            axis={singleLine ? 'horizontal' : 'vertical'}
            modifiers={modifiers as never}
          />
        )}
      </Host>
    </View>
  );
}

export { NativeTextField };
