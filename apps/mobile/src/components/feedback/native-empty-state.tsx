import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/native/text';
import { NativeButton } from '@/components/native/button';
import { isIOS } from '@/lib/platform';

interface NativeEmptyStateProps {
  /** SF Symbol name for iOS (e.g. 'magnifyingglass', 'house', 'doc.text') */
  sfSymbol?: SymbolViewProps['name'];
  /** Fallback Lucide icon for Android (and iOS if no sfSymbol) */
  icon?: LucideIcon;
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

/**
 * Native-feeling empty state with SF Symbols on iOS and Lucide on Android.
 * Centered layout with generous spacing, fade-in animation.
 */
function NativeEmptyState({
  sfSymbol,
  icon: LucideIconComponent,
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
    <Animated.View entering={FadeIn.duration(300)} style={containerStyle}>
      {isIOS && sfSymbol ? (
        <SymbolView name={sfSymbol} size={iconSize} tintColor={colors.tertiaryForeground} />
      ) : (
        LucideIconComponent && (
          <LucideIconComponent
            size={iconSize}
            color={colors.tertiaryForeground}
            strokeWidth={1.5}
          />
        )
      )}

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
