import { Platform, View } from 'react-native';

interface NativeDividerProps {
  /** Left inset in points (iOS only, default: 0) */
  insetLeft?: number;
}

function NativeDivider({ insetLeft = 0 }: NativeDividerProps) {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, Divider } = require('@expo/ui/swift-ui');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { padding } = require('@expo/ui/swift-ui/modifiers');

    return (
      <Host matchContents>
        <Divider modifiers={insetLeft > 0 ? [padding({ leading: insetLeft })] : undefined} />
      </Host>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, Divider } = require('@expo/ui/jetpack-compose');

  return (
    <View style={insetLeft > 0 ? { marginLeft: insetLeft } : undefined}>
      <Host matchContents>
        <Divider />
      </Host>
    </View>
  );
}

export { NativeDivider };
export type { NativeDividerProps };
