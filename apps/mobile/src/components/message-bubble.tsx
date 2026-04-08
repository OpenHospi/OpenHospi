import * as Clipboard from 'expo-clipboard';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';

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
        }}
        className={isOwn ? 'bg-primary' : 'bg-muted'}
        onTouchEnd={undefined}
        onStartShouldSetResponder={() => true}
        onResponderGrant={undefined}>
        {showSender && !isOwn && senderName && (
          <Text
            className="text-foreground text-xs font-medium"
            style={{ opacity: 0.7, marginBottom: 2 }}>
            {senderName}
          </Text>
        )}

        <Pressable
          style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}
          onLongPress={handleLongPress}>
          <Text
            className={`text-sm ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
            style={{ flexShrink: 1 }}>
            {text}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text
              className={isOwn ? 'text-primary-foreground' : 'text-muted-foreground'}
              style={{ fontSize: 10, opacity: 0.5 }}>
              {timestamp}
            </Text>
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
