import { ChevronDown } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { shadow } from '@/design/tokens/shadows';
import { ThemedText } from '@/components/primitives/themed-text';

type Props = {
  visible: boolean;
  onPress: () => void;
  newMessageCount?: number;
};

export function ScrollToBottomFab({ visible, onPress, newMessageCount }: Props) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        style={[
          styles.fab,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...shadow('md'),
          },
        ]}>
        <ChevronDown size={20} color={colors.foreground} />
      </Pressable>
      {newMessageCount && newMessageCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText color={colors.primaryForeground} style={{ fontSize: 10, fontWeight: '600' }}>
            {newMessageCount > 99 ? '99+' : String(newMessageCount)}
          </ThemedText>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});
