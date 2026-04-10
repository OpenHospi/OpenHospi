import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/design';
import type { TypographyVariant } from '@/design/tokens/typography';

interface ThemedTextProps extends TextProps {
  /** Typography variant from the iOS semantic type scale */
  variant?: TypographyVariant;
  /** Override the default foreground color */
  color?: string;
  /** Font weight override */
  weight?: TextStyle['fontWeight'];
}

function ThemedText({
  variant = 'body',
  color,
  weight,
  style,
  children,
  ...props
}: ThemedTextProps) {
  const { colors, typography } = useTheme();

  const textStyle: TextStyle = {
    ...typography[variant],
    color: color ?? colors.foreground,
    ...(weight ? { fontWeight: weight } : undefined),
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
}

export { ThemedText };
export type { ThemedTextProps };
