import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';
import { hapticLight } from '@/lib/haptics';

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export function FilterChip({ label, onRemove }: FilterChipProps) {
  const { colors } = useTheme();

  function handleRemove() {
    hapticLight();
    onRemove();
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <View style={[styles.chip, { backgroundColor: colors.muted }]}>
        <ThemedText variant="subheadline" color={colors.foreground}>
          {label}
        </ThemedText>
        <Pressable onPress={handleRemove} hitSlop={8}>
          <X size={14} color={colors.foreground} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
