import { StyleSheet, View } from 'react-native';

import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';

type StatusPillColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'muted';

interface StatusPillProps {
  label: string;
  color?: StatusPillColor;
  /** Optional SF Symbol / Material Symbol name rendered before the label. */
  icon?: string;
}

// 0x18 = 24/255 ≈ 9% — matches iOS tinted badge contrast on both light/dark surfaces.
const TINT_ALPHA = '29';

function StatusPill({ label, color = 'default', icon }: StatusPillProps) {
  const { colors, radius, spacing } = useTheme();

  const { background, foreground } = resolveTint(color, colors);

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: background,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          gap: spacing.xs,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      {icon ? <NativeIcon name={icon} size={12} color={foreground} /> : null}
      <ThemedText variant="caption1" weight="600" color={foreground}>
        {label}
      </ThemedText>
    </View>
  );
}

function resolveTint(color: StatusPillColor, colors: ReturnType<typeof useTheme>['colors']) {
  switch (color) {
    case 'primary':
      return { background: colors.primary + TINT_ALPHA, foreground: colors.primary };
    case 'success':
      return { background: colors.success + TINT_ALPHA, foreground: colors.success };
    case 'warning':
      return { background: colors.warning + TINT_ALPHA, foreground: colors.warning };
    case 'destructive':
      return { background: colors.destructive + TINT_ALPHA, foreground: colors.destructive };
    case 'info':
      return { background: colors.accent, foreground: colors.accentForeground };
    case 'muted':
      return { background: colors.muted, foreground: colors.mutedForeground };
    default:
      return { background: colors.secondaryBackground, foreground: colors.secondaryForeground };
  }
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});

export { StatusPill };
export type { StatusPillColor, StatusPillProps };
