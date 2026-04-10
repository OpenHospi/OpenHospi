import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MyRoomCard } from '@/components/rooms/my-room-card';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticPullToRefreshSnap } from '@/lib/haptics';
import { useMyRooms } from '@/services/my-rooms';

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

export default function MyRoomsListScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const router = useRouter();
  const { data: rooms, isLoading, refetch, isRefetching } = useMyRooms();

  const handleRefresh = () => {
    hapticPullToRefreshSnap();
    refetch();
  };

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
        icon={Home}
        title={t('title')}
        subtitle={t('empty')}
        actionLabel={t('createFirst')}
        onAction={() => router.push('/(app)/(tabs)/my-rooms/create/house-gate')}
      />
    );
  }

  return (
    <FlashList
      data={rooms}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <MyRoomCard room={item} />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    />
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 16,
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
});
