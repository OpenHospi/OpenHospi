import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/native/text';
import { PlatformSurface } from '@/components/layout/platform-surface';
import { useTheme } from '@/design';

interface GroupedSectionProps extends ViewProps {
  /** Remove horizontal margin (for full-width sections like photo carousels). */
  inset?: boolean;
  /** Uppercased caption rendered above the section (iOS Settings convention). */
  header?: string;
  /** Small caption rendered below the section (iOS Settings convention). */
  footer?: string;
}

function GroupedSection({
  inset = true,
  header,
  footer,
  children,
  style,
  ...props
}: GroupedSectionProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[inset && { marginHorizontal: spacing.lg }, (header || footer) && { gap: spacing.xs }]}
      {...props}>
      {header ? (
        <ThemedText
          variant="footnote"
          color={colors.tertiaryForeground}
          style={{ paddingHorizontal: spacing.md }}>
          {header.toUpperCase()}
        </ThemedText>
      ) : null}
      <PlatformSurface variant="grouped" style={[styles.surface, style]}>
        {children}
      </PlatformSurface>
      {footer ? (
        <ThemedText
          variant="footnote"
          color={colors.tertiaryForeground}
          style={{ paddingHorizontal: spacing.md }}>
          {footer}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: 'hidden',
  },
});

export { GroupedSection };
export type { GroupedSectionProps };
