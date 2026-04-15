import { Platform, StyleSheet } from 'react-native';

interface NativeDividerProps {
  /** Custom color for the divider line */
  color?: string;
}

function NativeDivider({ color }: NativeDividerProps) {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, Divider } = require('@expo/ui/swift-ui');

    return (
      <Host matchContents>
        <Divider />
      </Host>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, HorizontalDivider } = require('@expo/ui/jetpack-compose');

  return (
    <Host matchContents>
      <HorizontalDivider thickness={StyleSheet.hairlineWidth} color={color} />
    </Host>
  );
}

export { NativeDivider };
export type { NativeDividerProps };
