import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterSheet } from '@/components/filter-sheet';
import { RoomCard } from '@/components/room-card';
import { useTranslations } from '@/i18n';
import { useRooms } from '@/services/rooms';
import type { DiscoverFilters, DiscoverRoom } from '@/services/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export default function DiscoverScreen() {
  const t = useTranslations('app.discover');
  const tCommon = useTranslations('common.labels');
  const tFilters = useTranslations('app.discover.filters');

  const [filters, setFilters] = useState<DiscoverFilters>({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useRooms(filters);

  const rooms = data?.pages.flatMap((p) => p.rooms) ?? [];
  const totalCount = rooms.length;

  const filteredRooms = searchText
    ? rooms.filter((r) => r.title.toLowerCase().includes(searchText.toLowerCase()))
    : rooms;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: DiscoverRoom }) => (
      <View className="px-4 pb-3">
        <RoomCard room={item} supabaseUrl={SUPABASE_URL} />
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="gap-2 px-4 pb-2 pt-2">
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground"
            value={searchText}
            onChangeText={setSearchText}
            placeholder={tCommon('search')}
            placeholderTextColor="#999"
          />
          <Pressable
            className="items-center justify-center rounded-xl border border-border px-4"
            onPress={() => setFilterVisible(true)}
          >
            <Text className="text-sm font-medium text-foreground">{tFilters('showFilters')}</Text>
          </Pressable>
        </View>
        {totalCount > 0 && (
          <Text className="text-xs text-muted-foreground">
            {t('roomCount', { count: totalCount })}
          </Text>
        )}
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : filteredRooms.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-muted-foreground">{t('empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}
