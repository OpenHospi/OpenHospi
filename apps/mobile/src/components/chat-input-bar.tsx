import * as Haptics from 'expo-haptics';
import { Send } from 'lucide-react-native';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  placeholder: string;
};

export function ChatInputBar({ value, onChangeText, onSend, isSending, placeholder }: Props) {
  const insets = useSafeAreaInsets();
  const trimmed = value.trim();

  function handleSend() {
    if (!trimmed || isSending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend();
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 12 + insets.bottom,
        borderTopWidth: 1,
      }}
      className="border-border bg-background">
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
      <Pressable
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
      </Pressable>
    </View>
  );
}
