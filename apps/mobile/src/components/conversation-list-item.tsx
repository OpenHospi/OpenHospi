import { Archive, Lock, Shield } from 'lucide-react-native';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { NotificationBadge } from '@/components/notification-badge';
import { SwipeableRow } from '@/components/swipeable-row';
import { getStoragePublicUrl } from '@/lib/storage-url';

type Props = {
  id: string;
  roomTitle: string;
  roomPhotoUrl: string | null;
  displayName: string;
  lastMessageAt: string;
  unreadCount: number;
  locale: string;
  onPress: () => void;
  onArchive?: () => void;
};

function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return locale === 'nl' ? 'nu' : locale === 'de' ? 'jetzt' : 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) {
    return locale === 'nl' ? 'Gisteren' : locale === 'de' ? 'Gestern' : 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(locale, { weekday: 'short' });
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function ConversationListItem({
  roomTitle,
  roomPhotoUrl,
  displayName,
  lastMessageAt,
  unreadCount,
  locale,
  onPress,
  onArchive,
}: Props) {
  const initial = (roomTitle || displayName).charAt(0).toUpperCase();
  const hasUnread = unreadCount > 0;

  const archiveActions = onArchive
    ? [
        {
          icon: Archive,
          color: '#fff',
          backgroundColor: '#6b7280',
          onPress: onArchive,
        },
      ]
    : undefined;

  return (
    <SwipeableRow rightActions={archiveActions}>
      <AnimatedPressable
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
        className="bg-background">
        <View>
          <Avatar alt={roomTitle} style={{ width: 48, height: 48 }}>
            {roomPhotoUrl ? (
              <AvatarImage source={{ uri: getStoragePublicUrl(roomPhotoUrl, 'room-photos') }} />
            ) : null}
            <AvatarFallback>
              <Text className="text-muted-foreground font-medium">{initial}</Text>
            </AvatarFallback>
          </Avatar>
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            className="bg-background">
            <Lock size={10} className="text-primary" />
          </View>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              className={`text-sm ${hasUnread ? 'text-foreground font-semibold' : 'text-foreground font-medium'}`}
              numberOfLines={1}
              style={{ flex: 1 }}>
              {roomTitle}
            </Text>
            <Text className="text-muted-foreground text-xs" style={{ marginLeft: 8 }}>
              {formatRelativeTime(lastMessageAt, locale)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <Shield size={10} className="text-primary" />
              <Text variant="muted" className="text-xs" numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <View style={{ position: 'relative', marginLeft: 8 }}>
              <NotificationBadge count={unreadCount} />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </SwipeableRow>
  );
}
