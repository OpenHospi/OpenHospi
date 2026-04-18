import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LogoText } from '@/components/shared/logo-text';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { NativeIcon } from '@/components/native/icon';
import { ThemedBadge } from '@/components/native/badge';
import { ThemedText } from '@/components/native/text';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { RoomCard } from '@/components/rooms/room-card';
import { useDiscoverFilters } from '@/context/discover-filters';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight, hapticPullToRefreshSnap } from '@/lib/haptics';
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

function FilterPill({
  label,
  count,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  count: number;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  const active = count > 0;

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: colors.muted, borderless: false }}
      style={({ pressed }) => [
        styles.filterPill,
        {
          backgroundColor: active ? colors.primary : colors.secondaryBackground,
          borderColor: active ? colors.primary : colors.separator,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <NativeIcon
        name="line.3.horizontal.decrease"
        androidName="filter-list"
        size={16}
        color={active ? colors.primaryForeground : colors.foreground}
      />
      <ThemedText
        variant="subheadline"
        color={active ? colors.primaryForeground : colors.foreground}>
        {label}
      </ThemedText>
      {active ? <ThemedBadge variant="secondary" label={String(count)} /> : null}
    </Pressable>
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

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.pillBar}>
        <FilterPill
          label={tFilters('title')}
          count={activeFilterCount}
          onPress={openFilters}
          accessibilityLabel={tFilters('showFilters')}
        />
      </View>
      {totalCount > 0 ? (
        <ThemedText
          variant="caption1"
          color={colors.tertiaryForeground}
          style={{ paddingHorizontal: spacing.lg }}>
          {searchText
            ? t('roomCountFiltered', { showing: filteredRooms.length, total: totalCount })
            : t('roomCount', { count: totalCount })}
        </ThemedText>
      ) : null}
    </View>
  );

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
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pillBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
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
