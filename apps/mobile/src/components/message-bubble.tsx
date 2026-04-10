import * as Clipboard from 'expo-clipboard';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';

type MessageStatus = 'sending' | 'sent' | 'delivered';

type Props = {
  isOwn: boolean;
  text: string;
  senderName: string | null;
  showSender: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  timestamp: string;
  status?: MessageStatus;
  onDelete?: () => void;
};

const STATUS_ICONS = {
  sending: { icon: Clock, opacity: 0.5 },
  sent: { icon: Check, opacity: 0.7 },
  delivered: { icon: CheckCheck, opacity: 0.7 },
} as const;

export function MessageBubble({
  isOwn,
  text,
  senderName,
  showSender,
  isFirstInGroup,
  isLastInGroup,
  timestamp,
  status,
  onDelete: _onDelete,
}: Props) {
  const { colors } = useTheme();
  const topRadius = isFirstInGroup ? 16 : 4;
  const bottomRadius = isLastInGroup ? 16 : 4;

  async function handleLongPress() {
    await Clipboard.setStringAsync(text);
  }

  return (
    <Animated.View
      entering={SlideInDown.duration(200)}
      style={{
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        marginTop: isFirstInGroup ? 8 : 2,
      }}>
      <View
        style={{
          maxWidth: '75%',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopLeftRadius: isOwn ? 16 : topRadius,
          borderTopRightRadius: isOwn ? topRadius : 16,
          borderBottomLeftRadius: isOwn ? 16 : bottomRadius,
          borderBottomRightRadius: isOwn ? bottomRadius : 16,
          backgroundColor: isOwn ? colors.primary : colors.muted,
        }}
        onTouchEnd={undefined}
        onStartShouldSetResponder={() => true}
        onResponderGrant={undefined}>
        {showSender && !isOwn && senderName && (
          <ThemedText
            variant="caption1"
            weight="500"
            color={colors.foreground}
            style={{ opacity: 0.7, marginBottom: 2 }}>
            {senderName}
          </ThemedText>
        )}

        <Pressable style={styles.messageContent} onLongPress={handleLongPress}>
          <ThemedText
            variant="subheadline"
            color={isOwn ? colors.primaryForeground : colors.foreground}
            style={{ flexShrink: 1 }}>
            {text}
          </ThemedText>

          <View style={styles.timestampRow}>
            <ThemedText
              color={isOwn ? colors.primaryForeground : colors.mutedForeground}
              style={{ fontSize: 10, opacity: 0.5 }}>
              {timestamp}
            </ThemedText>
            {isOwn &&
              status &&
              (() => {
                const { icon: StatusIcon, opacity } = STATUS_ICONS[status];
                return (
                  <StatusIcon
                    size={12}
                    color={isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'}
                    style={{ opacity }}
                  />
                );
              })()}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
