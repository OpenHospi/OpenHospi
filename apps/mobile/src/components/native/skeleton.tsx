import React from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';

interface ThemedSkeletonProps {
  /** Width (number or '100%') */
  width?: number | `${number}%`;
  /** Height in points */
  height?: number;
  /** Border radius (default: md) */
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  /** Make it circular (sets border radius to half of size) */
  circle?: boolean;
  style?: ViewStyle;
}

function ThemedSkeleton({
  width = '100%',
  height = 16,
  rounded = 'md',
  circle,
  style,
}: ThemedSkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 1000 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const skeletonStyle: ViewStyle = {
    width,
    height,
    borderRadius: circle ? height / 2 : radius[rounded],
    backgroundColor: colors.muted,
  };

  return <Animated.View style={[skeletonStyle, animatedStyle, style]} />;
}

export { ThemedSkeleton };
export type { ThemedSkeletonProps };
