import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
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
  const { t: tFilters } = useTranslation('translation', {
    keyPrefix: 'app.discover.filters',
  });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const { filters, activeFilterCount } = useDiscoverFilters();
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

  const openFilters = () => router.push('/(app)/(modals)/filter-sheet');

  const headerOptions = {
    headerTitle: () => <LogoText height={40} />,
  };

  const listHeader =
    totalCount > 0 ? (
      <View style={styles.listHeader}>
        <ThemedText
          variant="caption1"
          color={colors.tertiaryForeground}
          style={{ paddingHorizontal: spacing.lg }}>
          {searchText
            ? t('roomCountFiltered', { showing: filteredRooms.length, total: totalCount })
            : t('roomCount', { count: totalCount })}
        </ThemedText>
      </View>
    ) : null;

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <Stack.SearchBar
        placeholder={tCommon('search')}
        hideWhenScrolling
        obscureBackground
        onChangeText={(event) => setSearchText(event.nativeEvent.text)}
        onCancelButtonPress={() => setSearchText('')}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          onPress={openFilters}
          accessibilityLabel={tFilters('showFilters')}
          selected={activeFilterCount > 0}
          tintColor={colors.primary}>
          <Stack.Toolbar.Icon sf="line.3.horizontal.decrease" />
          <Stack.Toolbar.Label>{tFilters('title')}</Stack.Toolbar.Label>
          {activeFilterCount > 0 ? (
            <Stack.Toolbar.Badge>{String(activeFilterCount)}</Stack.Toolbar.Badge>
          ) : null}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      {isPending ? (
        <View style={styles.skeletonList}>
          <SkeletonRoomCard />
          <SkeletonRoomCard />
          <SkeletonRoomCard />
        </View>
      ) : (
        <FlashList
          contentInsetAdjustmentBehavior="automatic"
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: DiscoverRoom }) => (
            <View style={styles.cardWrapper}>
              <RoomCard room={item} />
            </View>
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<NativeEmptyState sfSymbol="magnifyingglass" title={t('empty')} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ThemedSkeleton width="100%" height={80} rounded="lg" />
              </View>
            ) : null
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listHeader: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
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
