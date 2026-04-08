import { Paperclip, Send } from 'lucide-react-native';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/animated-pressable';
import { hapticLight } from '@/lib/haptics';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  placeholder: string;
};

export function ChatInputBar({ value, onChangeText, onSend, isSending, placeholder }: Props) {
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
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          paddingHorizontal: 12,
          paddingTop: 12,
          borderTopWidth: 1,
        },
        animatedStyle,
      ]}
      className="border-border bg-background">
      <Pressable
        disabled
        style={{
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.3,
        }}>
        <Paperclip size={20} className="text-muted-foreground" />
      </Pressable>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        style={{
          flex: 1,
          minHeight: 40,
          maxHeight: 120,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 14,
        }}
        className="bg-muted text-foreground"
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />

      <AnimatedPressable
        onPress={handleSend}
        disabled={!trimmed || isSending}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: trimmed ? 1 : 0.5,
        }}
        className="bg-primary">
        {isSending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Send size={18} color="white" />
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}
