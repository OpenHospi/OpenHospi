import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

type OfflineToastProps = {
  visible: boolean;
  onDismiss: () => void;
  message?: string;
};

const AUTO_DISMISS_MS = 3000;

export function OfflineToast({
  visible,
  onDismiss,
  message = "You're offline",
}: OfflineToastProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(
          AUTO_DISMISS_MS,
          withTiming(0, { duration: 200 }, () => runOnJS(onDismiss)())
        )
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, opacity, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 100,
          left: 24,
          right: 24,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          alignItems: 'center',
          zIndex: 999,
        },
        animatedStyle,
      ]}
      className="bg-foreground">
      <Text className="text-background text-sm font-medium">{message}</Text>
    </Animated.View>
  );
}
