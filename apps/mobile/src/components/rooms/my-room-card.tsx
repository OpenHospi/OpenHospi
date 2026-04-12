import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { Pause, Play, Trash2 } from 'lucide-react-native';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { RoomStatus } from '@openhospi/shared/enums';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { SwipeableRow } from '@/components/shared/swipeable-row';
import { ThemedText } from '@/components/primitives/themed-text';
import { StatusPill } from '@/components/layout/status-pill';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';
import { LIST_ITEM_ENTERING } from '@/lib/animations';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { isAndroid, isIOS } from '@/lib/platform';
import type { MyRoomSummary } from '@openhospi/shared/api-types';

const STATUS_PILL_COLOR: Record<
  string,
  'primary' | 'success' | 'warning' | 'destructive' | 'muted'
> = {
  [RoomStatus.active]: 'success',
  [RoomStatus.draft]: 'muted',
  [RoomStatus.paused]: 'warning',
  [RoomStatus.closed]: 'destructive',
};

type Props = {
  room: MyRoomSummary;
  onDelete?: (roomId: string) => void;
  onStatusChange?: (roomId: string, newStatus: string) => void;
};

export function MyRoomCard({ room, onDelete, onStatusChange }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  const coverUrl = room.coverPhotoUrl
    ? getStoragePublicUrl(room.coverPhotoUrl, 'room-photos')
    : null;

  const navigateToDetail = () =>
    router.push({ pathname: '/(app)/manage-room/[id]', params: { id: room.id } });

  const navigateToEdit = () =>
    router.push({ pathname: '/(app)/manage-room/[id]/edit', params: { id: room.id } });

  const navigateToShareLink = () =>
    router.push({ pathname: '/(app)/manage-room/[id]/share-link', params: { id: room.id } });

  const handleDelete = () => {
    Alert.alert(t('status.confirmDeleteTitle'), t('status.confirmDelete'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('delete'),
        style: 'destructive',
        onPress: () => onDelete?.(room.id),
      },
    ]);
  };

  const handleTogglePause = () => {
    const newStatus = room.status === RoomStatus.active ? RoomStatus.paused : RoomStatus.active;
    onStatusChange?.(room.id, newStatus);
  };

  // Build swipe actions based on room status
  const swipeActions = [];
  if (room.status === RoomStatus.draft && onDelete) {
    swipeActions.push({
      icon: Trash2,
      color: colors.destructiveForeground,
      backgroundColor: colors.destructive,
      onPress: handleDelete,
    });
  }
  if (room.status === RoomStatus.active && onStatusChange) {
    swipeActions.push({
      icon: Pause,
      color: colors.primaryForeground,
      backgroundColor: colors.warning,
      onPress: handleTogglePause,
    });
  }
  if (room.status === RoomStatus.paused && onStatusChange) {
    swipeActions.push({
      icon: Play,
      color: colors.primaryForeground,
      backgroundColor: colors.success,
      onPress: handleTogglePause,
    });
  }

  const cardContent = (
    <SwipeableRow rightActions={swipeActions.length > 0 ? swipeActions : undefined}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`${room.title}, ${tEnums(`room_status.${room.status}`)}`}
        onPress={navigateToDetail}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.tertiaryBackground,
              borderRadius: radius.lg,
            },
            isAndroid ? shadow('sm') : undefined,
          ]}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={[
                styles.coverImage,
                { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
              ]}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.coverPlaceholder,
                {
                  backgroundColor: colors.muted,
                  borderTopLeftRadius: radius.lg,
                  borderTopRightRadius: radius.lg,
                },
              ]}>
              {isIOS ? (
                <SymbolView name="house" size={32} tintColor={colors.tertiaryForeground} />
              ) : (
                <MaterialIcons name="home" size={32} color={colors.tertiaryForeground} />
              )}
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <ThemedText variant="headline" numberOfLines={1} style={styles.titleText}>
                {room.title || tEnums('room_status.draft')}
              </ThemedText>
              <StatusPill
                label={tEnums(`room_status.${room.status}`)}
                color={STATUS_PILL_COLOR[room.status] ?? 'muted'}
              />
            </View>

            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {tEnums(`city.${room.city}`)}
            </ThemedText>

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                {isIOS ? (
                  <SymbolView name="eurosign" size={18} tintColor={colors.primary} />
                ) : (
                  <MaterialIcons name="euro" size={18} color={colors.primary} />
                )}
                <ThemedText variant="title3" color={colors.primary}>
                  {room.totalCost}
                  {tCommon('perMonth')}
                </ThemedText>
              </View>
              <View style={styles.applicantCount}>
                {isIOS ? (
                  <SymbolView name="person.2" size={14} tintColor={colors.tertiaryForeground} />
                ) : (
                  <MaterialIcons name="people" size={14} color={colors.tertiaryForeground} />
                )}
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {room.applicantCount}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </SwipeableRow>
  );

  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Host, ContextMenu, Button: ExpoButton } = require('@expo/ui/swift-ui');

    return (
      <Animated.View entering={LIST_ITEM_ENTERING}>
        <Host matchContents>
          <ContextMenu>
            <ContextMenu.Items>
              <ExpoButton label={t('actions.edit')} systemImage="pencil" onPress={navigateToEdit} />
              <ExpoButton
                label={t('shareLink.title')}
                systemImage="link"
                onPress={navigateToShareLink}
              />
              {room.status === RoomStatus.active && onStatusChange && (
                <ExpoButton
                  label={t('actions.pause')}
                  systemImage="pause.circle"
                  onPress={handleTogglePause}
                />
              )}
              {room.status === RoomStatus.paused && onStatusChange && (
                <ExpoButton
                  label={t('actions.activate')}
                  systemImage="play.circle"
                  onPress={handleTogglePause}
                />
              )}
              {room.status === RoomStatus.draft && onDelete && (
                <ExpoButton
                  label={t('actions.deleteDraft')}
                  systemImage="trash"
                  role="destructive"
                  onPress={handleDelete}
                />
              )}
            </ContextMenu.Items>
            <ContextMenu.Trigger>{cardContent}</ContextMenu.Trigger>
          </ContextMenu>
        </Host>
      </Animated.View>
    );
  }

  // Android: long-press opens action sheet
  const handleLongPress = () => {
    const options: { text: string; onPress: () => void; style?: 'destructive' | 'cancel' }[] = [
      { text: t('actions.edit'), onPress: navigateToEdit },
      { text: t('shareLink.title'), onPress: navigateToShareLink },
    ];

    if (room.status === RoomStatus.active && onStatusChange) {
      options.push({ text: t('actions.pause'), onPress: handleTogglePause });
    }
    if (room.status === RoomStatus.paused && onStatusChange) {
      options.push({ text: t('actions.activate'), onPress: handleTogglePause });
    }
    if (room.status === RoomStatus.draft && onDelete) {
      options.push({ text: t('actions.deleteDraft'), onPress: handleDelete, style: 'destructive' });
    }
    options.push({ text: tCommon('cancel'), onPress: () => {}, style: 'cancel' });

    Alert.alert(room.title || tEnums('room_status.draft'), undefined, options);
  };

  return (
    <Animated.View entering={LIST_ITEM_ENTERING}>
      <Pressable onLongPress={handleLongPress}>{cardContent}</Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  coverImage: {
    aspectRatio: 4 / 3,
    width: '100%',
  },
  coverPlaceholder: {
    aspectRatio: 4 / 3,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 8,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
