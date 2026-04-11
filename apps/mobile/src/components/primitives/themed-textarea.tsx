import React from 'react';
import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';

interface ThemedTextareaProps extends TextInputProps {
  error?: boolean;
  minHeight?: number;
}

function ThemedTextarea({
  error,
  minHeight = 120,
  editable = true,
  style,
  ...props
}: ThemedTextareaProps) {
  const { colors, typography } = useTheme();
  const [focused, setFocused] = React.useState(false);

  const inputStyle: TextStyle = {
    minHeight,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryBackground,
    borderWidth: StyleSheet.hairlineWidth,
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
export type { ThemedTextareaProps };
