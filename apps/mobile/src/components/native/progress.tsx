import { Platform, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';

interface NativeProgressProps {
  /** Progress value from 0 to 1. Omit for indeterminate. */
  value?: number | null;
  style?: ViewStyle;
}

function NativeProgress({ value, style }: NativeProgressProps) {
  const { colors } = useTheme();

  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, ProgressView } = require('@expo/ui/swift-ui');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { tint } = require('@expo/ui/swift-ui/modifiers');

    return (
      <View style={style}>
        <Host style={{ alignSelf: 'stretch' }}>
          <ProgressView value={value ?? undefined} modifiers={[tint(colors.primary)]} />
        </Host>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Host, LinearProgressIndicator } = require('@expo/ui/jetpack-compose');

  return (
    <View style={style}>
      <Host style={{ alignSelf: 'stretch' }}>
        <LinearProgressIndicator
          progress={value ?? undefined}
          color={colors.primary}
          trackColor={colors.muted}
        />
      </Host>
    </View>
  );
}

export { NativeProgress };
export type { NativeProgressProps };
