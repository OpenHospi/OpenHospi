import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { SPRING_SNAPPY } from '@/lib/animations';
import { hapticLight } from '@/lib/haptics';

type AnimatedPressableProps = React.ComponentProps<typeof Pressable> & {
  scaleValue?: number;
};

export function AnimatedPressable({
  scaleValue = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn(e: Parameters<NonNullable<typeof onPressIn>>[0]) {
    if (!disabled) {
      scale.value = withSpring(scaleValue, SPRING_SNAPPY);
      hapticLight();
    }
    onPressIn?.(e);
  }

  function handlePressOut(e: Parameters<NonNullable<typeof onPressOut>>[0]) {
    scale.value = withSpring(1, SPRING_SNAPPY);
    onPressOut?.(e);
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      />
    </Animated.View>
  );
}
