import React from 'react';
import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';

interface ThemedInputProps extends TextInputProps {
  /** Show in an error state */
  error?: boolean;
}

function ThemedInput({ error, editable = true, style, ...props }: ThemedInputProps) {
  const { colors, typography } = useTheme();
  const [focused, setFocused] = React.useState(false);

  const inputStyle: TextStyle = {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: error ? colors.destructive : focused ? colors.primary : colors.separator,
    justifyContent: 'center',
    opacity: editable ? 1 : 0.5,
    ...typography.body,
    color: colors.foreground,
    padding: 0,
    paddingLeft: 12,
    paddingRight: 12,
  };

  return (
    <TextInput
      style={[inputStyle, style as TextStyle]}
      placeholderTextColor={colors.tertiaryForeground}
      editable={editable}
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

export { ThemedInput };
export type { ThemedInputProps };
