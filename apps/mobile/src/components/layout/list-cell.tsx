import { Pressable, StyleSheet, View, type AccessibilityState, type ViewStyle } from 'react-native';

import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';

interface ListCellProps {
  label: string;
  /** Secondary value text rendered right-aligned, before any trailing accessory or chevron. */
  value?: string;
  /** Optional SF Symbol / Material Symbol name to render as a leading icon. */
  icon?: string;
  /** Arbitrary leading slot — overrides `icon` when provided. */
  leftContent?: React.ReactNode;
  /** Arbitrary trailing slot (switch, badge, etc.). Suppresses `value` / chevron. */
  rightContent?: React.ReactNode;
  /** Show a disclosure chevron. Defaults to true when `onPress` is set. */
  chevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  /** Minimum row height. Defaults to 44 (iOS) / 48 (Android) via theme spacing. */
  minHeight?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

function ListCell({
  label,
  value,
  icon,
  leftContent,
  rightContent,
  chevron,
  onPress,
  disabled,
  destructive,
  minHeight,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: ListCellProps) {
  const { colors, spacing } = useTheme();

  const showChevron = chevron ?? !!onPress;
  const labelColor = destructive ? colors.destructive : colors.foreground;
  const iconColor = destructive ? colors.destructive : colors.secondaryForeground;

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minHeight ?? (isIOS ? 44 : 48),
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    opacity: disabled ? 0.5 : 1,
  };

  const leading =
    leftContent ?? (icon ? <NativeIcon name={icon} size={22} color={iconColor} /> : null);

  const body = (
    <View style={rowStyle}>
      {leading}
      <View style={styles.labelWrap}>
        <ThemedText variant="body" color={labelColor}>
          {label}
        </ThemedText>
      </View>
      {rightContent}
      {value && !rightContent ? (
        <ThemedText variant="body" color={colors.tertiaryForeground}>
          {value}
        </ThemedText>
      ) : null}
      {showChevron ? (
        <NativeIcon
          name="chevron.right"
          androidName="chevron-right"
          size={16}
          color={colors.tertiaryForeground}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return body;
  }

  const composedState: AccessibilityState = {
    ...accessibilityState,
    disabled: disabled || accessibilityState?.disabled,
  };

  return (
    <Pressable
      onPress={() => {
        if (isIOS) hapticLight();
        onPress();
      }}
      disabled={disabled}
      android_ripple={{ color: colors.muted }}
      style={({ pressed }) => (pressed && isIOS ? { backgroundColor: colors.muted } : undefined)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${label}${value ? `, ${value}` : ''}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={composedState}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    flex: 1,
  },
});

export { ListCell };
export type { ListCellProps };
