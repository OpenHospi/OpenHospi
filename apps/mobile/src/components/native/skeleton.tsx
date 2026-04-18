import React from 'react';
import { type AccessibilityRole, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
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
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

function ThemedSkeleton({
  width = '100%',
  height = 16,
  rounded = 'md',
  circle,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
}: ThemedSkeletonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = withRepeat(withTiming(0.4, { duration: 1000 }), -1, true);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const skeletonStyle: ViewStyle = {
    width,
    height,
    borderRadius: circle ? height / 2 : radius[rounded],
    backgroundColor: colors.muted,
  };

  return (
    <Animated.View
      style={[skeletonStyle, animatedStyle, style]}
      accessibilityRole={accessibilityRole ?? 'progressbar'}
      accessibilityLabel={accessibilityLabel ?? 'Loading'}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ busy: true }}
    />
  );
}

export { ThemedSkeleton };
export type { ThemedSkeletonProps };
