import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { useNetworkStatus } from '@/lib/network';
import { useRealtimeStatus } from '@/lib/supabase';

export function ConnectionStatusBar() {
  const { colors } = useTheme();
  const { isOnline } = useNetworkStatus();
  const realtimeStatus = useRealtimeStatus();

  const isVisible = !isOnline || realtimeStatus === 'reconnecting';
  const label = !isOnline ? 'No internet connection' : 'Reconnecting...';

  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isVisible ? 1 : 0, { duration: reduceMotion ? 0 : 300 });
  }, [isVisible, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, 32]),
    opacity: progress.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.destructive }, animatedStyle]}>
      <ThemedText variant="caption1" weight="500" color={colors.destructiveForeground}>
        {label}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
