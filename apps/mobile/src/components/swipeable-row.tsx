import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SPRING_SNAPPY } from '@/lib/animations';
import { hapticMedium } from '@/lib/haptics';

type SwipeAction = {
  icon: LucideIcon;
  color: string;
  backgroundColor: string;
  onPress: () => void;
};

type SwipeableRowProps = {
  children: React.ReactNode;
  rightActions?: SwipeAction[];
};

const SWIPE_THRESHOLD = 80;

export function SwipeableRow({ children, rightActions }: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const hasActions = !!rightActions && rightActions.length > 0;
  const actionWidth = hasActions ? SWIPE_THRESHOLD * rightActions.length : 0;

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .enabled(hasActions)
    .onUpdate((e) => {
      translateX.value = Math.min(0, Math.max(-actionWidth, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD / 2) {
        translateX.value = withSpring(-actionWidth, SPRING_SNAPPY);
        runOnJS(hapticMedium)();
      } else {
        translateX.value = withSpring(0, SPRING_SNAPPY);
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    width: -translateX.value,
  }));

  if (!hasActions) {
    return <>{children}</>;
  }

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
          },
          actionsStyle,
        ]}>
        {rightActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={index}
              onPress={() => {
                translateX.value = withSpring(0, SPRING_SNAPPY);
                action.onPress();
              }}
              style={{
                width: SWIPE_THRESHOLD,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: action.backgroundColor,
              }}>
              <Icon size={20} color={action.color} />
            </Pressable>
          );
        })}
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={contentStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
