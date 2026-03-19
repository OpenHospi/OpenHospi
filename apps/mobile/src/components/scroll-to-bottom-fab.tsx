import { ChevronDown } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';

type Props = {
  visible: boolean;
  onPress: () => void;
  newMessageCount?: number;
};

export function ScrollToBottomFab({ visible, onPress, newMessageCount }: Props) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{ position: 'absolute', right: 16, bottom: 16 }}>
      <Pressable
        onPress={onPress}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
        }}
        className="bg-card border-border shadow-md">
        <ChevronDown size={20} className="text-foreground" />
      </Pressable>
      {newMessageCount && newMessageCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
          className="bg-primary">
          <Text className="text-primary-foreground" style={{ fontSize: 10, fontWeight: '600' }}>
            {newMessageCount > 99 ? '99+' : String(newMessageCount)}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
