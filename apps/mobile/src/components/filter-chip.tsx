import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { hapticLight } from '@/lib/haptics';

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export function FilterChip({ label, onRemove }: FilterChipProps) {
  function handleRemove() {
    hapticLight();
    onRemove();
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
        className="bg-secondary">
        <Text className="text-secondary-foreground text-sm">{label}</Text>
        <Pressable onPress={handleRemove} hitSlop={8}>
          <X size={14} className="text-secondary-foreground" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
