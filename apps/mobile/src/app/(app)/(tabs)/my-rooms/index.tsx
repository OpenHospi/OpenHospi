import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MyRoomCard } from '@/components/rooms/my-room-card';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';
import { hapticLight, hapticPullToRefreshSnap } from '@/lib/haptics';
import { useDeleteRoom, useMyRooms, useUpdateRoomStatus } from '@/services/my-rooms';

function SkeletonRoomCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.skeletonCard,
        { backgroundColor: colors.tertiaryBackground, borderRadius: radius.lg },
      ]}>
      <ThemedSkeleton width="100%" height={200} rounded="lg" />
      <View style={styles.skeletonContent}>
        <ThemedSkeleton width="70%" height={18} />
        <ThemedSkeleton width="40%" height={14} />
        <ThemedSkeleton width="30%" height={20} />
      </View>
    </View>
  );
}

function PostRoomFab({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: colors.primaryForeground, borderless: false }}
      style={({ pressed }) => [
        styles.fab,
        shadow('md'),
        {
          backgroundColor: colors.primary,
          bottom: bottom + 16,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <NativeIcon name="plus" androidName="add" size={20} color={colors.primaryForeground} />
      <ThemedText variant="headline" color={colors.primaryForeground}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function MyRoomsListScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const router = useRouter();
  const { data: rooms, isLoading, refetch, isRefetching } = useMyRooms();
  const deleteRoom = useDeleteRoom();
  const updateStatus = useUpdateRoomStatus();

  const handleRefresh = () => {
    hapticPullToRefreshSnap();
    refetch();
  };

  const createRoom = () => router.push('/(app)/manage-room/create/house-gate');

  if (isLoading) {
    return (
      <View style={styles.skeletonList}>
        <SkeletonRoomCard />
        <SkeletonRoomCard />
        <SkeletonRoomCard />
      </View>
    );
  }

  if (!rooms?.length) {
    return (
      <NativeEmptyState
        sfSymbol="house"
        androidIcon="home"
        title={t('title')}
        subtitle={t('empty')}
        actionLabel={t('createFirst')}
        onAction={createRoom}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <MyRoomCard
              room={item}
              onDelete={(roomId) => deleteRoom.mutate(roomId)}
              onStatusChange={(roomId, status) => updateStatus.mutate({ roomId, status })}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      />
      <PostRoomFab label={t('createNew')} onPress={createRoom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 96,
  },
  skeletonList: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  skeletonCard: {
    overflow: 'hidden',
  },
  skeletonContent: {
    padding: 16,
    gap: 10,
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radius.full,
  },
});
