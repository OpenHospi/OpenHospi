import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';
import { ThemedText } from '@/components/native/text';
import { isIOS } from '@/lib/platform';

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
      entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
      exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
      style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scroll to latest messages"
        accessibilityHint={newMessageCount ? `${newMessageCount} new messages below` : undefined}
        hitSlop={8}
        onPress={onPress}
        style={[
          styles.fab,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...shadow('md'),
          },
        ]}>
        {isIOS ? (
          <SymbolView name="chevron.down" size={20} tintColor={colors.foreground} />
        ) : (
          <MaterialIcons name="expand-more" size={20} color={colors.foreground} />
        )}
      </Pressable>
      {newMessageCount && newMessageCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText variant="caption2" weight="600" color={colors.primaryForeground}>
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
    end: 16,
    bottom: 16,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    top: -6,
    end: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});
