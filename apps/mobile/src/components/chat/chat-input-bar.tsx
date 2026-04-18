import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

import { NativeIcon } from '@/components/native/icon';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { showActionSheet } from '@/lib/action-sheet';
import { hapticLight, hapticSelection } from '@/lib/haptics';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  placeholder: string;
  onPickCamera?: () => void;
  onPickLibrary?: () => void;
};

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  isSending,
  placeholder,
  onPickCamera,
  onPickLibrary,
}: Props) {
  const { colors, typography } = useTheme();
  const keyboard = useAnimatedKeyboard();
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isSending;

  const containerAnimated = useAnimatedStyle(() => ({
    paddingBottom: 12 + keyboard.height.value,
  }));

  function handleSend() {
    if (!canSend) return;
    hapticLight();
    onSend();
  }

  function handleAttach() {
    hapticSelection();
    const options = [];
    if (onPickCamera) options.push({ label: 'Camera', onPress: onPickCamera });
    if (onPickLibrary) options.push({ label: 'Photo Library', onPress: onPickLibrary });
    if (options.length === 0) return;
    showActionSheet('Attach', options);
  }

  const sendButtonStyle: ViewStyle = {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: canSend ? colors.primary : colors.muted,
    opacity: canSend ? 1 : 0.7,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderTopColor: colors.separator },
        containerAnimated,
      ]}>
      {onPickCamera || onPickLibrary ? (
        <Pressable
          onPress={handleAttach}
          hitSlop={8}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Attach"
          accessibilityHint="Attach camera or photo">
          <NativeIcon
            name="plus.circle.fill"
            androidName="add-circle"
            size={28}
            color={colors.primary}
          />
        </Pressable>
      ) : null}

      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.secondaryBackground,
            borderColor: colors.separator,
          },
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.tertiaryForeground}
          multiline
          style={[
            styles.input,
            { color: colors.foreground, fontSize: typography.subheadline.fontSize },
          ]}
          accessibilityLabel={placeholder}
          returnKeyType="default"
          blurOnSubmit={false}
          submitBehavior="newline"
        />
      </View>

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        hitSlop={6}
        style={sendButtonStyle}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend, busy: isSending }}>
        <NativeIcon
          name="arrow.up"
          androidName="arrow-upward"
          size={18}
          color={canSend ? colors.primaryForeground : colors.tertiaryForeground}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    minHeight: 36,
    maxHeight: 140,
    borderRadius: radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  input: {
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 0,
    lineHeight: 20,
  },
});
