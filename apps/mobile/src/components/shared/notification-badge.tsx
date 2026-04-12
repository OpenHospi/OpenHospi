import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/animations';

type NotificationBadgeProps = {
  count: number;
};

export function NotificationBadge({ count }: NotificationBadgeProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = count > 0 ? withSpring(1, SPRING_BOUNCY) : withSpring(0, SPRING_SNAPPY);
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: colors.destructive }, animatedStyle]}>
      <ThemedText variant="caption2" weight="700" color={colors.primaryForeground}>
        {count > 99 ? '99+' : String(count)}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
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
});
