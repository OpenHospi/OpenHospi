import { Pressable, StyleSheet, View } from 'react-native';

import { AppContextMenu } from '@/components/native/context-menu';
import { ThemedAvatar } from '@/components/native/avatar';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { NotificationBadge } from '@/components/shared/notification-badge';
import { SwipeableRow } from '@/components/shared/swipeable-row';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticDelete, hapticLight } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';

type Props = {
  id: string;
  roomTitle: string;
  roomPhotoUrl: string | null;
  displayName: string;
  lastMessagePreview?: string | null;
  lastMessageAt: string;
  unreadCount: number;
  locale: string;
  onPress: () => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
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
  lastMessagePreview,
  lastMessageAt,
  unreadCount,
  locale,
  onPress,
  onArchive,
  onMute,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  const hasUnread = unreadCount > 0;
  const relativeTime = formatRelativeTime(lastMessageAt, locale);
  const avatarUri = roomPhotoUrl ? getStoragePublicUrl(roomPhotoUrl, 'room-photos') : null;
  const preview = lastMessagePreview?.trim() || displayName;

  const swipeActions = [];
  if (onArchive) {
    swipeActions.push({
      iconName: 'archivebox.fill',
      color: colors.primaryForeground,
      backgroundColor: colors.mutedForeground,
      accessibilityLabel: 'Archive',
      onPress: () => {
        hapticLight();
        onArchive();
      },
    });
  }
  if (onDelete) {
    swipeActions.push({
      iconName: 'trash.fill',
      color: colors.destructiveForeground,
      backgroundColor: colors.destructive,
      accessibilityLabel: 'Delete',
      onPress: () => {
        hapticDelete();
        onDelete();
      },
    });
  }

  const contextActions = [
    ...(onMute
      ? [
          {
            key: 'mute',
            label: 'Mute',
            systemImage: 'bell.slash',
            androidSystemImage: 'notifications-off',
            onPress: onMute,
          },
        ]
      : []),
    ...(onArchive
      ? [
          {
            key: 'archive',
            label: 'Archive',
            systemImage: 'archivebox',
            androidSystemImage: 'archive',
            onPress: onArchive,
          },
        ]
      : []),
    ...(onDelete
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

  const row = (
    <SwipeableRow rightActions={swipeActions.length > 0 ? swipeActions : undefined}>
      <Pressable
        onPress={() => {
          hapticLight();
          onPress();
        }}
        android_ripple={{ color: colors.muted }}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: pressed ? colors.muted : colors.background,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${roomTitle}, ${displayName}, ${relativeTime}`}
        accessibilityHint="Opens conversation"
        accessibilityState={{ selected: hasUnread }}
        accessibilityValue={hasUnread ? { text: `${unreadCount} unread` } : undefined}>
        <View>
          <ThemedAvatar source={avatarUri} fallback={roomTitle} size={52} />
          <View
            style={[
              styles.lockBadge,
              { backgroundColor: colors.background, borderColor: colors.background },
            ]}>
            <NativeIcon name="lock.fill" androidName="lock" size={10} color={colors.primary} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <ThemedText
              variant="subheadline"
              weight={hasUnread ? '700' : '600'}
              numberOfLines={1}
              style={styles.titleText}>
              {roomTitle}
            </ThemedText>
            <ThemedText
              variant="caption1"
              weight={hasUnread ? '600' : '400'}
              color={hasUnread ? colors.primary : colors.tertiaryForeground}
              style={styles.time}>
              {relativeTime}
            </ThemedText>
          </View>

          <View style={styles.bottomRow}>
            <ThemedText
              variant="footnote"
              weight={hasUnread ? '500' : '400'}
              color={hasUnread ? colors.foreground : colors.tertiaryForeground}
              numberOfLines={1}
              style={styles.preview}>
              {preview}
            </ThemedText>
            {hasUnread ? (
              <View style={styles.unreadWrap}>
                <NotificationBadge count={unreadCount} />
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </SwipeableRow>
  );

  if (contextActions.length === 0) return row;

  return <AppContextMenu actions={contextActions}>{row}</AppContextMenu>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    flex: 1,
  },
  time: {
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 18,
  },
  preview: {
    flex: 1,
  },
  unreadWrap: {
    position: 'relative',
    width: 20,
    height: 18,
  },
});
