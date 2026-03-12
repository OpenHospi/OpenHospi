import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LogoText } from '@/components/logo-text';
import { Text } from '@/components/ui/text';
import { RoomCard } from '@/components/room-card';
import { useDiscoverFilters } from '@/context/discover-filters';
import { useRooms } from '@/services/rooms';
import type { DiscoverRoom } from '@/services/types';

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
        hideWhenScrolling={false}
        onChangeText={(event) => onSearchChange(event.nativeEvent.text)}
        onCancelButtonPress={() => onSearchChange('')}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="line.3.horizontal.decrease" onPress={onFilterPress} />
      </Stack.Toolbar>
    </>
  );
}

export default function DiscoverScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.discover' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();

  const { filters } = useDiscoverFilters();
  const [searchText, setSearchText] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, refetch, isRefetching } =
    useRooms(filters);

  const rooms = data?.pages.flatMap((p) => p.rooms) ?? [];
  const totalCount = rooms.length;

  const filteredRooms = searchText
    ? rooms.filter((r) => r.title.toLowerCase().includes(searchText.toLowerCase()))
    : rooms;

  if (isPending) {
    return (
      <>
        <DiscoverHeader
          searchPlaceholder={tCommon('search')}
          onSearchChange={setSearchText}
          onFilterPress={() => router.push('/(app)/filter-sheet' as never)}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <DiscoverHeader
        searchPlaceholder={tCommon('search')}
        onSearchChange={setSearchText}
        onFilterPress={() => router.push('/(app)/filter-sheet' as never)}
      />
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }: { item: DiscoverRoom }) => (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <RoomCard room={item} />
          </View>
        )}
        ListHeaderComponent={
          totalCount > 0 ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text variant="muted" className="text-xs">
                {searchText
                  ? t('roomCountFiltered', { showing: filteredRooms.length, total: totalCount })
                  : t('roomCount', { count: totalCount })}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
            }}>
            <View
              style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}
              className="rounded-lg border border-dashed">
              <Text variant="muted" className="text-center">
                {t('empty')}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={filteredRooms.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </>
  );
}
