import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Host,
  Button,
  OutlinedButton,
  FilledTonalButton,
  TextButton,
  Text,
  Spacer,
  RNHostView,
} from '@expo/ui/jetpack-compose';
import { width, fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import { useTheme } from '@/design';
import { type Colors } from '@/design/tokens/colors';
import { hapticLight } from '@/lib/haptics';

import type { ButtonVariant, NativeButtonProps } from './button.types';

function NativeButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  materialIcon,
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

  const ButtonComponent = getButtonComponent(variant);
  const buttonColors = getContainerColors(variant, colors);
  const iconColor = getIconColor(variant, colors);

  return (
    <View
      style={[styles.fullWidth, style]}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading, ...(accessibilityState ?? {}) }}
      accessibilityValue={accessibilityValue}>
      <Host style={styles.fullWidth}>
        <ButtonComponent
          onClick={handlePress}
          enabled={!isDisabled}
          colors={buttonColors}
          modifiers={[fillMaxWidth()]}>
          {materialIcon && (
            <>
              <RNHostView matchContents>
                <MaterialIcons name={materialIcon} size={18} color={iconColor} />
              </RNHostView>
              <Spacer modifiers={[width(8)]} />
            </>
          )}
          <Text>{label}</Text>
        </ButtonComponent>
      </Host>
    </View>
  );
}

function getButtonComponent(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
    case 'destructive':
      return Button;
    case 'secondary':
      return FilledTonalButton;
    case 'outline':
      return OutlinedButton;
    case 'ghost':
    case 'link':
      return TextButton;
  }
}

function getContainerColors(variant: ButtonVariant, colors: Colors) {
  switch (variant) {
    case 'primary':
      return { containerColor: colors.primary, contentColor: colors.primaryForeground };
    case 'destructive':
      return { containerColor: colors.destructive, contentColor: colors.destructiveForeground };
    default:
      return undefined;
  }
}

function getIconColor(variant: ButtonVariant, colors: Colors): string {
  switch (variant) {
    case 'primary':
      return colors.primaryForeground;
    case 'destructive':
      return colors.destructiveForeground;
    default:
      return colors.primary;
  }
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
});

export { NativeButton };
