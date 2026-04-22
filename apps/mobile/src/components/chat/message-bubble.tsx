import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AppContextMenu } from '@/components/native/context-menu';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { MESSAGE_OTHER_ENTERING, MESSAGE_OWN_ENTERING } from '@/lib/animations';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

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
  onReply?: () => void;
};

const STATUS_ICON: Record<MessageStatus, { sf: string; material: string; opacity: number }> = {
  sending: { sf: 'clock', material: 'schedule', opacity: 0.5 },
  sent: { sf: 'checkmark', material: 'check', opacity: 0.7 },
  delivered: { sf: 'checkmark.message', material: 'done-all', opacity: 0.75 },
  read: { sf: 'checkmark.message.fill', material: 'done-all', opacity: 1 },
};

// iOS-Messages style corner radii. Big on the outer corners, small where
// bubbles meet in a run. The "tail" corner (bottom-right for own, bottom-left
// for other) always stays rounded so the tail reads cleanly.
const BIG = 18;
const SMALL = 4;

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
  onReply,
}: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    hapticSuccess();
  }

  const radiiOwn = {
    borderTopLeftRadius: BIG,
    borderTopRightRadius: isFirstInGroup ? BIG : SMALL,
    borderBottomRightRadius: isLastInGroup ? BIG : SMALL,
    borderBottomLeftRadius: BIG,
  };

  const radiiOther = {
    borderTopLeftRadius: isFirstInGroup ? BIG : SMALL,
    borderTopRightRadius: BIG,
    borderBottomRightRadius: BIG,
    borderBottomLeftRadius: isLastInGroup ? BIG : SMALL,
  };

  const bubbleStyle: ViewStyle = {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: isOwn ? colors.primary : colors.secondaryBackground,
    ...(isOwn ? radiiOwn : radiiOther),
  };

  const textColor = isOwn ? colors.primaryForeground : colors.foreground;
  const metaColor = isOwn ? colors.primaryForeground : colors.tertiaryForeground;
  const statusIcon = status ? STATUS_ICON[status] : null;

  const a11yLabel = [
    isOwn ? 'You' : (senderName ?? 'Contact'),
    text,
    timestamp,
    status ? `status ${status}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const bubbleContent = (
    <View style={bubbleStyle}>
      {showSender && !isOwn && senderName ? (
        <ThemedText
          variant="caption1"
          weight="600"
          color={colors.primary}
          style={styles.senderName}>
          {senderName}
        </ThemedText>
      ) : null}

      <View style={styles.messageRow}>
        <ThemedText variant="subheadline" color={textColor} style={styles.messageText}>
          {text}
        </ThemedText>

        <View style={styles.meta}>
          <ThemedText
            variant="caption2"
            color={metaColor}
            style={[styles.timestamp, { opacity: isOwn ? 0.8 : 0.7 }]}>
            {timestamp}
          </ThemedText>
          {isOwn && statusIcon ? (
            <NativeIcon
              name={statusIcon.sf}
              androidName={statusIcon.material}
              size={12}
              color={colors.primaryForeground}
            />
          ) : null}
        </View>
      </View>
    </View>
  );

  const actions = [
    {
      key: 'copy',
      label: 'Copy',
      systemImage: 'doc.on.doc',
      androidSystemImage: 'content-copy',
      onPress: handleCopy,
    },
    ...(onReply
      ? [
          {
            key: 'reply',
            label: 'Reply',
            systemImage: 'arrowshape.turn.up.left',
            androidSystemImage: 'reply',
            onPress: () => {
              hapticLight();
              onReply();
            },
          },
        ]
      : []),
    ...(isOwn && onDelete
      ? [
          {
            key: 'delete',
            label: 'Delete',
            systemImage: 'trash',
            androidSystemImage: 'delete',
            destructive: true,
            onPress: onDelete,
          },
        ]
      : []),
  ];

  const wrapperStyle: ViewStyle = {
    alignItems: isOwn ? 'flex-end' : 'flex-start',
    marginTop: isFirstInGroup ? 8 : 2,
  };

  const entering = reduceMotion ? undefined : isOwn ? MESSAGE_OWN_ENTERING : MESSAGE_OTHER_ENTERING;

  // On Android, AppContextMenu is a passthrough; use Pressable onLongPress to
  // trigger the first non-destructive action (Copy) as a minimum affordance.
  // The screen-level delete action is surfaced via a trailing swipe, not here.
  return (
    <Animated.View
      entering={entering}
      style={wrapperStyle}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}>
      <AppContextMenu actions={actions}>
        <Pressable
          onLongPress={handleCopy}
          delayLongPress={350}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityHint="Long press for actions">
          {bubbleContent}
        </Pressable>
      </AppContextMenu>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  senderName: {
    marginBottom: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  messageText: {
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginStart: 'auto',
  },
  timestamp: {
    fontVariant: ['tabular-nums'],
  },
});
