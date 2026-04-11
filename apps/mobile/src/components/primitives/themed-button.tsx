import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  type PressableProps,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';
import { hapticLight } from '@/lib/haptics';
import { ThemedText } from './themed-text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ThemedButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  haptic?: boolean;
}

function ThemedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  haptic = true,
  children,
  style,
  onPress,
  ...props
}: ThemedButtonProps) {
  const { colors } = useTheme();

  const handlePress = (e: any) => {
    if (haptic) hapticLight();
    onPress?.(e);
  };

  const bgColor = getBackgroundColor(variant, colors);
  const textColor = getTextColor(variant, colors);
  const borderColor = variant === 'outline' ? colors.border : 'transparent';
  const height = size === 'sm' ? 36 : size === 'lg' ? 48 : size === 'icon' ? 40 : 44;
  const paddingHorizontal = size === 'icon' ? 0 : size === 'sm' ? 12 : size === 'lg' ? 24 : 16;
  const width = size === 'icon' ? 40 : undefined;

  const buttonStyle: ViewStyle = {
    height,
    paddingHorizontal,
    width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: bgColor,
    borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth : 0,
    borderColor,
    opacity: disabled || loading ? 0.5 : 1,
    ...(variant !== 'ghost' && variant !== 'link' ? shadow('sm') : {}),
  };

  const isTextChild = typeof children === 'string';

  return (
    <Pressable
      role="button"
      disabled={disabled || loading}
      onPress={handlePress}
      android_ripple={
        variant !== 'link' ? { color: 'rgba(0,0,0,0.1)', borderless: false } : undefined
      }
      style={(state) => [
        buttonStyle,
        state.pressed && Platform.OS === 'ios' && { opacity: 0.7 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : isTextChild ? (
        <ThemedText variant="subheadline" weight="600" color={textColor}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </Pressable>
  );
}

function getBackgroundColor(variant: ButtonVariant, colors: any): string {
  switch (variant) {
    case 'primary':
      return colors.primary;
    case 'secondary':
      return colors.muted;
    case 'outline':
      return colors.card;
    case 'destructive':
      return colors.destructive;
    case 'ghost':
      return 'transparent';
    case 'link':
      return 'transparent';
  }
}

function getTextColor(variant: ButtonVariant, colors: any): string {
  switch (variant) {
    case 'primary':
      return colors.primaryForeground;
    case 'secondary':
      return colors.foreground;
    case 'outline':
      return colors.foreground;
    case 'destructive':
      return colors.destructiveForeground;
    case 'ghost':
      return colors.foreground;
    case 'link':
      return colors.primary;
  }
}

export { ThemedButton };
export type { ThemedButtonProps, ButtonVariant, ButtonSize };
