import React from 'react';
import { Pressable, Platform, View, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';
import { hapticLight } from '@/lib/haptics';

interface ListCellProps {
  /** Primary label text */
  label: string;
  /** Secondary value text (displayed right-aligned before chevron) */
  value?: string;
  /** Custom content to render on the right instead of value text */
  rightContent?: React.ReactNode;
  /** Left icon or content */
  leftContent?: React.ReactNode;
  /** Show a disclosure chevron (default: true if onPress is provided) */
  chevron?: boolean;
  /** Makes the cell tappable */
  onPress?: () => void;
  /** Destructive styling (red label) */
  destructive?: boolean;
  /** Minimum height (default: 44 on iOS, 48 on Android) */
  minHeight?: number;
}

function ListCell({
  label,
  value,
  rightContent,
  leftContent,
  chevron,
  onPress,
  destructive,
  minHeight,
}: ListCellProps) {
  const { colors, spacing } = useTheme();

  const showChevron = chevron ?? !!onPress;
  const height = minHeight ?? Platform.select({ ios: 44, android: 48 })!;

  const cellStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: height,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  };

  const handlePress = () => {
    if (onPress) {
      hapticLight();
      onPress();
    }
  };

  const content = (
    <View style={cellStyle}>
      {leftContent}
      <View style={{ flex: 1 }}>
        <ThemedText variant="body" color={destructive ? colors.destructive : colors.foreground}>
          {label}
        </ThemedText>
      </View>
      {rightContent}
      {value && !rightContent && (
        <ThemedText variant="body" color={colors.tertiaryForeground}>
          {value}
        </ThemedText>
      )}
      {showChevron && (
        <ChevronRight size={16} color={colors.tertiaryForeground} strokeWidth={2.5} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
        style={({ pressed }) =>
          pressed && Platform.OS === 'ios' ? { backgroundColor: colors.muted } : undefined
        }
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export { ListCell };
export type { ListCellProps };
