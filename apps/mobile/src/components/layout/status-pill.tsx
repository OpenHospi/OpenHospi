import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { ThemedText } from '@/components/primitives/themed-text';

interface StatusPillProps {
  /** Display text */
  label: string;
  /** Semantic color */
  color: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
}

/**
 * Small colored pill for inline status indicators.
 * Uses a tinted background with matching text color.
 */
function StatusPill({ label, color }: StatusPillProps) {
  const { colors } = useTheme();

  const colorMap = {
    primary: { bg: colors.primary + '18', text: colors.primary },
    success: { bg: colors.success + '18', text: colors.success },
    warning: { bg: colors.warning + '18', text: colors.warning },
    destructive: { bg: colors.destructive + '18', text: colors.destructive },
    muted: { bg: colors.muted, text: colors.mutedForeground },
  };

  const { bg, text } = colorMap[color];

  const pillStyle: ViewStyle = {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: bg,
    alignSelf: 'flex-start',
  };

  return (
    <View style={pillStyle}>
      <ThemedText variant="caption1" weight="600" color={text}>
        {label}
      </ThemedText>
    </View>
  );
}

export { StatusPill };
export type { StatusPillProps };
