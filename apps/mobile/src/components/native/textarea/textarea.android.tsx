import React from 'react';
import { TextInput, type TextStyle } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';

import type { ThemedTextareaProps } from './textarea.types';

function ThemedTextarea({
  error,
  minHeight = 120,
  editable = true,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
  ...props
}: ThemedTextareaProps) {
  const { colors, typography } = useTheme();
  const [focused, setFocused] = React.useState(false);

  const inputStyle: TextStyle = {
    minHeight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryBackground,
    borderWidth: focused ? 2 : 1,
    borderColor: error ? colors.destructive : focused ? colors.primary : colors.separator,
    opacity: editable ? 1 : 0.5,
    ...typography.body,
    color: colors.foreground,
    textAlignVertical: 'top',
  };

  return (
    <TextInput
      style={[inputStyle, style]}
      placeholderTextColor={colors.tertiaryForeground}
      editable={editable}
      multiline
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? props.placeholder}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !editable, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
}

export { ThemedTextarea };
