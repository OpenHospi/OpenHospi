import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type Props = {
  isOwn: boolean;
  text: string;
  senderName: string | null;
  showSender: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  timestamp: string;
};

export function MessageBubble({
  isOwn,
  text,
  senderName,
  showSender,
  isFirstInGroup,
  isLastInGroup,
  timestamp,
}: Props) {
  const topRadius = isFirstInGroup ? 16 : 4;
  const bottomRadius = isLastInGroup ? 16 : 4;

  return (
    <View
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
        className={isOwn ? 'bg-primary' : 'bg-muted'}>
        {showSender && !isOwn && senderName && (
          <Text
            className="text-foreground text-xs font-medium"
            style={{ opacity: 0.7, marginBottom: 2 }}>
            {senderName}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <Text
            className={`text-sm ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
            style={{ flexShrink: 1 }}>
            {text}
          </Text>
          <Text
            className={isOwn ? 'text-primary-foreground' : 'text-muted-foreground'}
            style={{ fontSize: 10, opacity: 0.5 }}>
            {timestamp}
          </Text>
        </View>
      </View>
    </View>
  );
}
