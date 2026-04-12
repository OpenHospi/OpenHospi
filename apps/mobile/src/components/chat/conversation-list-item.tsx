import { Archive, Lock, Shield } from 'lucide-react-native';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { ThemedAvatar } from '@/components/primitives/themed-avatar';
import { ThemedText } from '@/components/primitives/themed-text';
import { NotificationBadge } from '@/components/shared/notification-badge';
import { SwipeableRow } from '@/components/shared/swipeable-row';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
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
  const { colors } = useTheme();
  const hasUnread = unreadCount > 0;

  const avatarUri = roomPhotoUrl ? getStoragePublicUrl(roomPhotoUrl, 'room-photos') : null;

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

  function handleLongPress() {
    Alert.alert(undefined as unknown as string, undefined, [
      { text: 'Mute', onPress: () => {} },
      { text: 'Block', onPress: () => {}, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const listRow = (
    <SwipeableRow rightActions={archiveActions}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`${roomTitle}, ${displayName}`}
        onPress={onPress}
        style={[styles.row, { backgroundColor: colors.background }]}>
        <View>
          <ThemedAvatar source={avatarUri} fallback={roomTitle} size={48} />
          <View style={[styles.lockBadge, { backgroundColor: colors.background }]}>
            <Lock size={10} color={colors.primary} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <ThemedText
              variant="subheadline"
              weight={hasUnread ? '600' : '500'}
              numberOfLines={1}
              style={styles.titleText}>
              {roomTitle}
            </ThemedText>
            <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.time}>
              {formatRelativeTime(lastMessageAt, locale)}
            </ThemedText>
          </View>
          <View style={styles.bottomRow}>
            <View style={styles.memberRow}>
              <Shield size={10} color={colors.primary} />
              <ThemedText
                variant="footnote"
                color={colors.tertiaryForeground}
                numberOfLines={1}
                style={styles.memberName}>
                {displayName}
              </ThemedText>
            </View>
            <NotificationBadge count={unreadCount} />
          </View>
        </View>
      </AnimatedPressable>
    </SwipeableRow>
  );

  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, ContextMenu, Button: ExpoButton } = require('@expo/ui/swift-ui');

    return (
      <Host matchContents>
        <ContextMenu>
          <ContextMenu.Items>
            <ExpoButton label="Mute" systemImage="bell.slash" onPress={() => {}} />
            <ExpoButton
              label="Block"
              systemImage="hand.raised"
              role="destructive"
              onPress={() => {}}
            />
          </ContextMenu.Items>
          <ContextMenu.Trigger>{listRow}</ContextMenu.Trigger>
        </ContextMenu>
      </Host>
    );
  }

  // Android: long-press opens native alert with actions
  return <Pressable onLongPress={handleLongPress}>{listRow}</Pressable>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    flex: 1,
  },
  time: {
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  memberName: {
    flex: 1,
  },
});
