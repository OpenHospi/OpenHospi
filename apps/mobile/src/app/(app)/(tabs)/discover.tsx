import { SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FilterSheet } from '@/components/filter-sheet';
import { RoomCard } from '@/components/room-card';
import { useTranslation } from 'react-i18next';
import { useRooms } from '@/services/rooms';
import type { DiscoverFilters, DiscoverRoom } from '@/services/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export default function DiscoverScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.discover' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

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
          <Input
            className="flex-1"
            value={searchText}
            onChangeText={setSearchText}
            placeholder={tCommon('search')}
          />
          <Button variant="outline" size="icon" onPress={() => setFilterVisible(true)}>
            <SlidersHorizontal size={18} className="text-foreground" />
          </Button>
        </View>
        {totalCount > 0 && (
          <Text variant="muted" className="text-xs">
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
          <Text variant="muted" className="text-center">
            {t('empty')}
          </Text>
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
