import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

type StepIndicatorProps = {
  totalSteps: number;
  currentStep: number;
};

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 8 }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Animated.View
          key={i}
          layout={LinearTransition.springify()}
          style={{
            height: 8,
            borderRadius: 4,
            width: i === currentStep ? 24 : 8,
          }}
          className={
            i === currentStep ? 'bg-primary' : i < currentStep ? 'bg-primary/50' : 'bg-muted'
          }
        />
      ))}
    </View>
  );
}
