import { ActivityIndicator, Platform, View, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';

interface NativeButtonProps {
  /** Button label text */
  label: string;
  /** Press handler */
  onPress?: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state — disables button and shows spinner */
  loading?: boolean;
  /** SF Symbol name for iOS (e.g. 'graduationcap.fill') */
  systemImage?: SFSymbol;
  /** MaterialIcons name for Android (e.g. 'school') */
  materialIcon?: string;
  /** Haptic feedback on press (default: true) */
  haptic?: boolean;
  /** Outer container style (margins, etc.) */
  style?: ViewStyle;
}

function NativeButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  systemImage,
  materialIcon,
  haptic = true,
  style,
}: NativeButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (haptic) hapticLight();
    onPress?.();
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={style}>
        <IOSButton
          label={label}
          onPress={handlePress}
          variant={variant}
          disabled={isDisabled}
          loading={loading}
          systemImage={systemImage}
          primaryColor={colors.primary}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <AndroidButton
        label={label}
        onPress={handlePress}
        variant={variant}
        disabled={isDisabled}
        loading={loading}
        materialIcon={materialIcon}
        colors={colors}
      />
    </View>
  );
}

function IOSButton({
  label,
  onPress,
  variant,
  disabled,
  loading,
  systemImage,
  primaryColor,
}: {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
  disabled: boolean;
  loading: boolean;
  systemImage?: SFSymbol;
  primaryColor: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, Button } = require('@expo/ui/swift-ui');
  const {
    buttonStyle,
    controlSize,
    tint,
    disabled: disabledMod,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@expo/ui/swift-ui/modifiers');

  const modifiers = [
    controlSize('large'),
    ...getIOSModifiers(variant, primaryColor, buttonStyle, tint),
  ];
  if (disabled) modifiers.push(disabledMod(true));

  if (loading) {
    return <ActivityIndicator color={primaryColor} />;
  }

  return (
    <Host style={{ alignSelf: 'stretch' }}>
      <Button
        label={label}
        systemImage={systemImage}
        role={variant === 'destructive' ? 'destructive' : 'default'}
        onPress={onPress}
        modifiers={modifiers}
      />
    </Host>
  );
}

function getIOSModifiers(
  variant: ButtonVariant,
  primaryColor: string,
  buttonStyle: (s: string) => unknown,
  tint: (c: string) => unknown
) {
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

function AndroidButton({
  label,
  onPress,
  variant,
  disabled,
  loading,
  materialIcon,
  colors,
}: {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
  disabled: boolean;
  loading: boolean;
  materialIcon?: string;
  colors: Record<string, string>;
}) {
  const {
    Host,
    Button,
    OutlinedButton,
    FilledTonalButton,
    TextButton,
    Text,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@expo/ui/jetpack-compose');

  if (loading) {
    return <ActivityIndicator color={colors.primary} />;
  }

  const ButtonComponent = getAndroidButtonComponent(
    variant,
    Button,
    OutlinedButton,
    FilledTonalButton,
    TextButton
  );
  const buttonColors = getAndroidColors(variant, colors);

  return (
    <Host style={{ alignSelf: 'stretch' }}>
      <ButtonComponent onClick={onPress} enabled={!disabled} colors={buttonColors}>
        <Text>{label}</Text>
      </ButtonComponent>
    </Host>
  );
}

function getAndroidButtonComponent(
  variant: ButtonVariant,
  Button: unknown,
  OutlinedButton: unknown,
  FilledTonalButton: unknown,
  TextButton: unknown
) {
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

function getAndroidColors(variant: ButtonVariant, colors: Record<string, string>) {
  switch (variant) {
    case 'primary':
      return { containerColor: colors.primary, contentColor: colors.primaryForeground };
    case 'destructive':
      return { containerColor: colors.destructive, contentColor: colors.destructiveForeground };
    default:
      return undefined;
  }
}

export { NativeButton };
export type { NativeButtonProps, ButtonVariant };
