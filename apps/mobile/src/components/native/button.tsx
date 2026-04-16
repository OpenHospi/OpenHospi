import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, StyleSheet, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { type Colors } from '@/design/tokens/colors';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface NativeButtonProps {
  /** Button label text */
  label: string;
  /** Press handler */
  onPress?: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state — disables button and shows spinner */
  loading?: boolean;
  /** SF Symbol name for iOS (e.g. 'graduationcap.fill') */
  systemImage?: SFSymbol;
  /** MaterialIcons name for Android (e.g. 'school') */
  materialIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  /** Haptic feedback on press (default: true) */
  haptic?: boolean;
  /** Outer container style (margins, etc.) */
  style?: ViewStyle;
}

function NativeButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
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
      <IOSButton
        label={label}
        onPress={handlePress}
        variant={variant}
        size={size}
        disabled={isDisabled}
        loading={loading}
        systemImage={systemImage}
        primaryColor={colors.primary}
        style={style}
      />
    );
  }

  return (
    <AndroidButton
      label={label}
      onPress={handlePress}
      style={style}
      variant={variant}
      disabled={isDisabled}
      loading={loading}
      materialIcon={materialIcon}
      colors={colors}
    />
  );
}

// ── iOS ──────────────────────────────────────────────────────

const IOS_SIZE_MAP = { sm: 'small', md: 'regular', lg: 'large' } as const;

function IOSButton({
  label,
  onPress,
  variant,
  size,
  disabled,
  loading,
  systemImage,
  primaryColor,
  style,
}: {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  loading: boolean;
  systemImage?: SFSymbol;
  primaryColor: string;
  style?: ViewStyle;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, Button } = require('@expo/ui/swift-ui');
  const {
    buttonStyle,
    controlSize,
    tint,
    frame,
    disabled: disabledMod,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@expo/ui/swift-ui/modifiers');

  if (loading) {
    return <ActivityIndicator color={primaryColor} />;
  }

  const modifiers = [
    controlSize(IOS_SIZE_MAP[size]),
    frame({ maxWidth: Infinity }),
    ...getIOSStyleModifiers(variant, primaryColor, buttonStyle, tint),
  ];
  if (disabled) modifiers.push(disabledMod(true));

  return (
    <Host style={[styles.fullWidth, { height: 50 }, style]}>
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

function getIOSStyleModifiers(
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

// ── Android ──────────────────────────────────────────────────

function AndroidButton({
  label,
  onPress,
  variant,
  disabled,
  loading,
  materialIcon,
  colors,
  style,
}: {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
  disabled: boolean;
  loading: boolean;
  materialIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  colors: Colors;
  style?: ViewStyle;
}) {
  const {
    Host,
    Button,
    OutlinedButton,
    FilledTonalButton,
    TextButton,
    Text,
    Spacer,
    RNHostView,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@expo/ui/jetpack-compose');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { width, fillMaxWidth } = require('@expo/ui/jetpack-compose/modifiers');

  if (loading) {
    return <ActivityIndicator color={colors.primary} />;
  }

  const ButtonComponent = getAndroidButtonComponent(variant, {
    Button,
    OutlinedButton,
    FilledTonalButton,
    TextButton,
  });
  const buttonColors = getAndroidColors(variant, colors);
  const iconColor = getAndroidIconColor(variant, colors);

  return (
    <Host style={[styles.fullWidth, style]}>
      <ButtonComponent
        onClick={onPress}
        enabled={!disabled}
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
  );
}

function getAndroidButtonComponent(variant: ButtonVariant, components: Record<string, any>) {
  switch (variant) {
    case 'primary':
    case 'destructive':
      return components.Button;
    case 'secondary':
      return components.FilledTonalButton;
    case 'outline':
      return components.OutlinedButton;
    case 'ghost':
    case 'link':
      return components.TextButton;
  }
}

function getAndroidColors(variant: ButtonVariant, colors: Colors) {
  switch (variant) {
    case 'primary':
      return { containerColor: colors.primary, contentColor: colors.primaryForeground };
    case 'destructive':
      return { containerColor: colors.destructive, contentColor: colors.destructiveForeground };
    default:
      return undefined;
  }
}

function getAndroidIconColor(variant: ButtonVariant, colors: Colors): string {
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
  fullWidth: {
    alignSelf: 'stretch',
  },
});

export { NativeButton };
export type { NativeButtonProps, ButtonVariant, ButtonSize };
