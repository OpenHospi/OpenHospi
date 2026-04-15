import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design';
import { shadow } from '@/design/tokens/shadows';

type BlurBottomBarProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Platform-aware bottom action bar.
 *
 * iOS: frosted glass effect using expo-blur BlurView with systemMaterial tint.
 * Android: opaque surface with elevation shadow.
 *
 * Automatically includes safe area bottom padding.
 */
export function BlurBottomBar({ children, style }: BlurBottomBarProps) {
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Math.max(bottom, 16),
    gap: 8,
  };

  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BlurView } = require('expo-blur');

    return (
      <View style={styles.wrapper}>
        <BlurView tint="systemMaterial" intensity={100} style={StyleSheet.absoluteFill} />
        <View
          style={[
            containerStyle,
            { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
            style,
          ]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: colors.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
          ...shadow('sm'),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
});
