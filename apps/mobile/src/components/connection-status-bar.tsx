import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { useNetworkStatus } from '@/lib/network';
import { useRealtimeStatus } from '@/lib/supabase';

export function ConnectionStatusBar() {
  const { isOnline } = useNetworkStatus();
  const realtimeStatus = useRealtimeStatus();

  const isVisible = !isOnline || realtimeStatus === 'reconnecting';
  const label = !isOnline ? 'No internet connection' : 'Reconnecting...';

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isVisible ? 1 : 0, { duration: 300 });
  }, [isVisible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, 32]),
    opacity: progress.value,
  }));

  return (
    <Animated.View
      style={[
        { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
        animatedStyle,
      ]}
      className="bg-destructive">
      <Text className="text-destructive-foreground text-xs font-medium">{label}</Text>
    </Animated.View>
  );
}
