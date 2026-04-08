import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/animations';

type NotificationBadgeProps = {
  count: number;
};

export function NotificationBadge({ count }: NotificationBadgeProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = count > 0 ? withSpring(1, SPRING_BOUNCY) : withSpring(0, SPRING_SNAPPY);
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -4,
          right: -8,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 4,
        },
        animatedStyle,
      ]}
      className="bg-destructive">
      <Text className="text-xs font-bold text-white">{count > 99 ? '99+' : String(count)}</Text>
    </Animated.View>
  );
}
