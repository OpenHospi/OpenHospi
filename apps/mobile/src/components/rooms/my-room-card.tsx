import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Alert, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { RoomStatus } from '@openhospi/shared/enums';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { SwipeableRow } from '@/components/shared/swipeable-row';
import { ThemedText } from '@/components/native/text';
import { AppContextMenu } from '@/components/native/context-menu';
import type { ContextMenuAction } from '@/components/native/context-menu';
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

  const swipeActions = [];
  if (room.status === RoomStatus.draft && onDelete) {
    swipeActions.push({
      iconName: 'trash',
      color: colors.destructiveForeground,
      backgroundColor: colors.destructive,
      accessibilityLabel: tCommon('delete'),
      onPress: handleDelete,
    });
  }
  if (room.status === RoomStatus.active && onStatusChange) {
    swipeActions.push({
      iconName: 'pause',
      color: colors.primaryForeground,
      backgroundColor: colors.warning,
      accessibilityLabel: t('actions.pause'),
      onPress: handleTogglePause,
    });
  }
  if (room.status === RoomStatus.paused && onStatusChange) {
    swipeActions.push({
      iconName: 'play',
      color: colors.primaryForeground,
      backgroundColor: colors.success,
      accessibilityLabel: t('actions.activate'),
      onPress: handleTogglePause,
    });
  }

  const menuActions: ContextMenuAction[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      systemImage: 'pencil',
      onPress: navigateToEdit,
    },
    {
      key: 'share',
      label: t('shareLink.title'),
      systemImage: 'link',
      onPress: navigateToShareLink,
    },
  ];
  if (room.status === RoomStatus.active && onStatusChange) {
    menuActions.push({
      key: 'pause',
      label: t('actions.pause'),
      systemImage: 'pause.circle',
      onPress: handleTogglePause,
    });
  }
  if (room.status === RoomStatus.paused && onStatusChange) {
    menuActions.push({
      key: 'activate',
      label: t('actions.activate'),
      systemImage: 'play.circle',
      onPress: handleTogglePause,
    });
  }
  if (room.status === RoomStatus.draft && onDelete) {
    menuActions.push({
      key: 'delete',
      label: t('actions.deleteDraft'),
      systemImage: 'trash',
      destructive: true,
      onPress: handleDelete,
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

  return (
    <Animated.View entering={LIST_ITEM_ENTERING}>
      <AppContextMenu actions={menuActions}>{cardContent}</AppContextMenu>
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
