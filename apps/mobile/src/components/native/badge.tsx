import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { ThemedText } from './text';

type BadgeVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';

interface ThemedBadgeProps extends ViewProps {
  variant?: BadgeVariant;
  /** Shortcut: pass a string to render as badge text */
  label?: string;
}

function ThemedBadge({
  variant = 'secondary',
  label,
  children,
  style,
  ...props
}: ThemedBadgeProps) {
  const { colors } = useTheme();

  const bgColor = getBadgeBg(variant, colors);
  const textColor = getBadgeText(variant, colors);
  const borderColor = variant === 'outline' ? colors.border : 'transparent';

  const badgeStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: bgColor,
    borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth : 0,
    borderColor,
    alignSelf: 'flex-start',
  };

  return (
    <View style={[badgeStyle, style]} {...props}>
      {label ? (
        <ThemedText variant="caption1" weight="500" color={textColor}>
          {label}
        </ThemedText>
      ) : (
        children
      )}
    </View>
  );
}

function getBadgeBg(variant: BadgeVariant, colors: any): string {
  switch (variant) {
    case 'primary':
      return colors.primary;
    case 'secondary':
      return colors.muted;
    case 'outline':
      return 'transparent';
    case 'destructive':
      return colors.destructive;
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
  }
}

function getBadgeText(variant: BadgeVariant, colors: any): string {
  switch (variant) {
    case 'primary':
      return colors.primaryForeground;
    case 'secondary':
      return colors.foreground;
    case 'outline':
      return colors.foreground;
    case 'destructive':
      return colors.destructiveForeground;
    case 'success':
      return colors.primaryForeground;
    case 'warning':
      return colors.primaryForeground;
  }
}

export { ThemedBadge };
export type { ThemedBadgeProps, BadgeVariant };
