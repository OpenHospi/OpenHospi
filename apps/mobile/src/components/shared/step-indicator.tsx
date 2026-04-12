import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';

type StepIndicatorProps = {
  totalSteps: number;
  currentStep: number;
};

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Animated.View
          key={i}
          layout={LinearTransition.springify()}
          style={{
            height: 8,
            borderRadius: radius.sm,
            width: i === currentStep ? 24 : 8,
            backgroundColor:
              i === currentStep
                ? colors.primary
                : i < currentStep
                  ? colors.primary + '80'
                  : colors.muted,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
