import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';
import { isIOS } from '@/lib/platform';

interface ListSeparatorProps {
  /** Left inset in points (iOS convention: inset past the leading content).
   *  Default: 16 (standard cell padding). Set to 0 for full-width. */
  insetLeft?: number;
}

/**
 * Platform-aware list separator.
 * iOS: hairline (0.5px) with configurable left inset.
 * Android: 1px full-width.
 */
function ListSeparator({ insetLeft = 16 }: ListSeparatorProps) {
  const { colors } = useTheme();

  const separatorStyle: ViewStyle = {
    height: isIOS ? StyleSheet.hairlineWidth : 1,
    backgroundColor: colors.separator,
    marginLeft: isIOS ? insetLeft : 0,
  };

  return <View style={separatorStyle} />;
}

export { ListSeparator };
export type { ListSeparatorProps };
