import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/design';

interface ThemedProgressProps {
  /** Progress value from 0 to 100 */
  value: number | null | undefined;
  /** Track height in points (default: 4) */
  height?: number;
  style?: ViewStyle;
}

function ThemedProgress({ value, height = 4, style }: ThemedProgressProps) {
  const { colors } = useTheme();

  const progress = useDerivedValue(() => value ?? 0);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: withSpring(`${interpolate(progress.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`, {
      overshootClamping: true,
    }),
  }));

  const trackStyle: ViewStyle = {
    height,
    width: '100%',
    borderRadius: height / 2,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  };

  const fillStyle: ViewStyle = {
    height: '100%',
    borderRadius: height / 2,
    backgroundColor: colors.primary,
  };

  return (
    <View style={[trackStyle, style]}>
      <Animated.View style={[fillStyle, indicatorStyle]} />
    </View>
  );
}

export { ThemedProgress };
export type { ThemedProgressProps };
