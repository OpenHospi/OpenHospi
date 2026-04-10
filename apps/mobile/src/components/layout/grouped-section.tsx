import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';
import { isAndroid } from '@/lib/platform';

interface GroupedSectionProps extends ViewProps {
  /** Remove horizontal margin (for full-width sections like photo carousels) */
  inset?: boolean;
}

/**
 * iOS Settings-style grouped section.
 *
 * On iOS: white/tertiaryBackground rounded container with 16px horizontal
 * margin, no border, no shadow. Depth comes from the background color
 * difference against the screen's secondaryBackground.
 *
 * On Android: surface container with slight elevation.
 *
 * Children should be ListCell components separated by ListSeparator.
 */
function GroupedSection({ inset = true, children, style, ...props }: GroupedSectionProps) {
  const { colors } = useTheme();

  const sectionStyle: ViewStyle = {
    backgroundColor: colors.tertiaryBackground,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...(inset ? { marginHorizontal: 16 } : {}),
    ...(isAndroid ? shadow('sm') : {}),
  };

  return (
    <View style={[sectionStyle, style]} {...props}>
      {children}
    </View>
  );
}

export { GroupedSection };
export type { GroupedSectionProps };
