import { Platform, StyleSheet } from 'react-native';
import type { AccessibilityRole } from 'react-native';

interface NativeDividerProps {
  /** Custom color for the divider line */
  color?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

function NativeDivider({
  color,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
}: NativeDividerProps) {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, Divider } = require('@expo/ui/swift-ui');

    return (
      <Host
        matchContents
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}>
        <Divider />
      </Host>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, HorizontalDivider } = require('@expo/ui/jetpack-compose');

  return (
    <Host
      matchContents
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}>
      <HorizontalDivider thickness={StyleSheet.hairlineWidth} color={color} />
    </Host>
  );
}

export { NativeDivider };
export type { NativeDividerProps };
