import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Host, Button } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  tint,
  frame,
  disabled as disabledMod,
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

import type { ButtonVariant, NativeButtonProps } from './button.types';

const IOS_SIZE_MAP = { sm: 'small', md: 'regular', lg: 'large' } as const;

function NativeButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  systemImage,
  haptic = true,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityValue,
}: NativeButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (haptic) hapticLight();
    onPress?.();
  };

  if (loading) {
    return <ActivityIndicator color={colors.primary} />;
  }

  const modifiers: unknown[] = [
    controlSize(IOS_SIZE_MAP[size]),
    frame({ maxWidth: Infinity }),
    ...getVariantModifiers(variant, colors.primary),
  ];
  if (isDisabled) modifiers.push(disabledMod(true));

  return (
    <View
      style={[styles.fullWidth, style]}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}>
      <Host style={[styles.fullWidth, styles.height]}>
        <Button
          label={label}
          systemImage={systemImage}
          role={variant === 'destructive' ? 'destructive' : 'default'}
          onPress={handlePress}
          modifiers={modifiers as never}
        />
      </Host>
    </View>
  );
}

function getVariantModifiers(variant: ButtonVariant, primaryColor: string): unknown[] {
  switch (variant) {
    case 'primary':
      return [buttonStyle('borderedProminent'), tint(primaryColor)];
    case 'secondary':
      return [buttonStyle('bordered')];
    case 'outline':
      return [buttonStyle('bordered')];
    case 'ghost':
      return [buttonStyle('borderless')];
    case 'destructive':
      return [buttonStyle('borderedProminent')];
    case 'link':
      return [buttonStyle('plain')];
  }
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  height: { height: 50 },
});

export { NativeButton };
