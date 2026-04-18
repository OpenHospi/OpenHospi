import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/native/text';
import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';

interface NativeEmptyStateProps {
  /** SF Symbol name. On Android, falls back to the built-in sf→material mapping or `androidIcon` override. */
  sfSymbol: string;
  /** Optional Material icon override for Android. */
  androidIcon?: string;
  /** Icon/symbol size (default: 48) */
  iconSize?: number;
  /** Primary title text */
  title: string;
  /** Optional descriptive subtitle */
  subtitle?: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Action button handler */
  onAction?: () => void;
}

function NativeEmptyState({
  sfSymbol,
  androidIcon,
  iconSize = 48,
  title,
  subtitle,
  actionLabel,
  onAction,
}: NativeEmptyStateProps) {
  const { colors, spacing } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['5xl'],
    gap: spacing.lg,
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300).reduceMotion(ReduceMotion.System)}
      style={containerStyle}>
      <NativeIcon
        name={sfSymbol}
        androidName={androidIcon}
        size={iconSize}
        color={colors.tertiaryForeground}
      />

      <View style={{ gap: spacing.xs, alignItems: 'center' }}>
        <ThemedText variant="title3" color={colors.foreground} style={{ textAlign: 'center' }}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText
            variant="subheadline"
            color={colors.tertiaryForeground}
            style={{ textAlign: 'center' }}>
            {subtitle}
          </ThemedText>
        )}
      </View>

      {actionLabel && onAction && (
        <NativeButton label={actionLabel} onPress={onAction} style={{ marginTop: spacing.sm }} />
      )}
    </Animated.View>
  );
}

export { NativeEmptyState };
export type { NativeEmptyStateProps };
