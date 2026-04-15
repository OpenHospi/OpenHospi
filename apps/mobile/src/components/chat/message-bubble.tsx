import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/native/text';
import { MESSAGE_OWN_ENTERING, MESSAGE_OTHER_ENTERING } from '@/lib/animations';
import { hapticSuccess } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';

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
  sending: { materialIcon: 'schedule' as const, sfSymbol: 'clock' as const, opacity: 0.5 },
  sent: { materialIcon: 'check' as const, sfSymbol: 'checkmark' as const, opacity: 0.7 },
  delivered: {
    materialIcon: 'done-all' as const,
    sfSymbol: 'checkmark.message' as const,
    opacity: 0.7,
  },
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

  function handleLongPress() {
    const actions: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [
      { text: 'Copy', onPress: handleCopy },
    ];
    if (isOwn && onDelete) {
      actions.push({ text: 'Delete', onPress: onDelete, style: 'destructive' });
    }
    actions.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(undefined as unknown as string, undefined, actions);
  }

  const entering = isOwn ? MESSAGE_OWN_ENTERING : MESSAGE_OTHER_ENTERING;

  const bubbleContent = (
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
            variant="caption2"
            color={isOwn ? colors.primaryForeground : colors.mutedForeground}
            style={styles.timestamp}>
            {timestamp}
          </ThemedText>
          {isOwn &&
            status &&
            (() => {
              const { materialIcon, sfSymbol, opacity } = STATUS_ICONS[status];
              const tint = isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)';
              return isIOS ? (
                <SymbolView name={sfSymbol} size={12} tintColor={tint} style={{ opacity }} />
              ) : (
                <MaterialIcons name={materialIcon} size={12} color={tint} style={{ opacity }} />
              );
            })()}
        </View>
      </View>
    </View>
  );

  if (Platform.OS === 'ios') {
    // iOS: use @expo/ui SwiftUI ContextMenu
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, ContextMenu, Button: ExpoButton } = require('@expo/ui/swift-ui');

    return (
      <Animated.View
        entering={entering}
        style={{
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          marginTop: isFirstInGroup ? 8 : 2,
        }}>
        <Host matchContents>
          <ContextMenu>
            <ContextMenu.Items>
              <ExpoButton label="Copy" systemImage="doc.on.doc" onPress={handleCopy} />
              {isOwn && onDelete && (
                <ExpoButton
                  label="Delete"
                  systemImage="trash"
                  role="destructive"
                  onPress={onDelete}
                />
              )}
            </ContextMenu.Items>
            <ContextMenu.Trigger>{bubbleContent}</ContextMenu.Trigger>
          </ContextMenu>
        </Host>
      </Animated.View>
    );
  }

  // Android: long-press opens Alert with actions
  return (
    <Animated.View
      entering={entering}
      style={{
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        marginTop: isFirstInGroup ? 8 : 2,
      }}>
      <Pressable onLongPress={handleLongPress}>{bubbleContent}</Pressable>
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
    opacity: 0.5,
  },
});
