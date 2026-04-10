import * as Clipboard from 'expo-clipboard';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import * as ContextMenu from 'zeego/context-menu';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';
import { MESSAGE_OWN_ENTERING, MESSAGE_OTHER_ENTERING } from '@/lib/animations';
import { hapticSuccess } from '@/lib/haptics';

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
  onDelete,
}: Props) {
  const { colors } = useTheme();
  const topRadius = isFirstInGroup ? 16 : 4;
  const bottomRadius = isLastInGroup ? 16 : 4;

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    hapticSuccess();
  }

  const entering = isOwn ? MESSAGE_OWN_ENTERING : MESSAGE_OTHER_ENTERING;

  return (
    <Animated.View
      entering={entering}
      style={{
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        marginTop: isFirstInGroup ? 8 : 2,
      }}>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
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
            }}>
            {showSender && !isOwn && senderName && (
              <ThemedText
                variant="caption1"
                weight="500"
                color={colors.foreground}
                style={styles.senderName}>
                {senderName}
              </ThemedText>
            )}

            <View style={styles.messageContent}>
              <ThemedText
                variant="subheadline"
                color={isOwn ? colors.primaryForeground : colors.foreground}
                style={styles.messageText}>
                {text}
              </ThemedText>

              <View style={styles.timestampRow}>
                <ThemedText
                  color={isOwn ? colors.primaryForeground : colors.mutedForeground}
                  style={styles.timestamp}>
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
            </View>
          </View>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item key="copy" onSelect={handleCopy}>
            <ContextMenu.ItemTitle>Copy</ContextMenu.ItemTitle>
            <ContextMenu.ItemIcon ios={{ name: 'doc.on.doc' }} />
          </ContextMenu.Item>
          {isOwn && onDelete && (
            <ContextMenu.Item key="delete" onSelect={onDelete} destructive>
              <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
              <ContextMenu.ItemIcon ios={{ name: 'trash' }} />
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Root>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  senderName: {
    opacity: 0.7,
    marginBottom: 2,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageText: {
    flexShrink: 1,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.5,
  },
});
