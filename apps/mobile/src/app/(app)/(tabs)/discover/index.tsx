import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LogoText } from '@/components/shared/logo-text';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedText } from '@/components/native/text';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { RoomCard } from '@/components/rooms/room-card';
import { useDiscoverFilters } from '@/context/discover-filters';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticPullToRefreshSnap } from '@/lib/haptics';
import { useRooms } from '@/services/rooms';
import type { DiscoverRoom } from '@openhospi/shared/api-types';

function DiscoverHeader({
  searchPlaceholder,
  onSearchChange,
  onFilterPress,
}: {
  searchPlaceholder: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
}) {
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <LogoText height={40} />,
        }}
      />
      <Stack.SearchBar
        placeholder={searchPlaceholder}
        hideWhenScrolling
        obscureBackground
        onChangeText={(event) => onSearchChange(event.nativeEvent.text)}
        onCancelButtonPress={() => onSearchChange('')}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="line.3.horizontal.decrease" onPress={onFilterPress} />
      </Stack.Toolbar>
    </>
  );
}

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
        <ThemedSkeleton width="50%" height={14} />
        <ThemedSkeleton width="30%" height={20} />
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.discover' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();
  const { colors } = useTheme();

  const { filters } = useDiscoverFilters();
  const [searchText, setSearchText] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, refetch, isRefetching } =
    useRooms(filters);

  const rooms = data?.pages.flatMap((p) => p.rooms) ?? [];
  const totalCount = rooms.length;

  const filteredRooms = searchText
    ? rooms.filter((r) => r.title.toLowerCase().includes(searchText.toLowerCase()))
    : rooms;

  const handleRefresh = () => {
    hapticPullToRefreshSnap();
    refetch();
  };

  if (isPending) {
    return (
      <>
        <DiscoverHeader
          searchPlaceholder={tCommon('search')}
          onSearchChange={setSearchText}
          onFilterPress={() => router.push('/(app)/(modals)/filter-sheet')}
        />
        <View style={styles.skeletonList}>
          <SkeletonRoomCard />
          <SkeletonRoomCard />
          <SkeletonRoomCard />
        </View>
      </>
    );
  }

  return (
    <>
      <DiscoverHeader
        searchPlaceholder={tCommon('search')}
        onSearchChange={setSearchText}
        onFilterPress={() => router.push('/(app)/(modals)/filter-sheet')}
      />
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: DiscoverRoom }) => (
          <View style={styles.cardWrapper}>
            <RoomCard room={item} />
          </View>
        )}
        ListHeaderComponent={
          totalCount > 0 ? (
            <View style={styles.countHeader}>
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {searchText
                  ? t('roomCountFiltered', { showing: filteredRooms.length, total: totalCount })
                  : t('roomCount', { count: totalCount })}
              </ThemedText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <NativeEmptyState sfSymbol="magnifyingglass" icon={Search} title={t('empty')} />
        }
        contentContainerStyle={styles.listContent}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  countHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  footer: {
    paddingVertical: 16,
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
