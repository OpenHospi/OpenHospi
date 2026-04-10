import { Paperclip, Send } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/animated-pressable';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  placeholder: string;
};

export function ChatInputBar({ value, onChangeText, onSend, isSending, placeholder }: Props) {
  const { colors } = useTheme();
  const keyboard = useAnimatedKeyboard();
  const trimmed = value.trim();

  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: 12 + keyboard.height.value,
  }));

  function handleSend() {
    if (!trimmed || isSending) return;
    hapticLight();
    onSend();
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { borderTopColor: colors.separator, backgroundColor: colors.background },
        animatedStyle,
      ]}>
      <Pressable disabled style={styles.attachButton}>
        <Paperclip size={20} color={colors.tertiaryForeground} />
      </Pressable>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.tertiaryForeground}
        multiline
        style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />

      <AnimatedPressable
        onPress={handleSend}
        disabled={!trimmed || isSending}
        style={[
          styles.sendButton,
          { backgroundColor: colors.primary, opacity: trimmed ? 1 : 0.5 },
        ]}>
        {isSending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Send size={18} color={colors.primaryForeground} />
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
