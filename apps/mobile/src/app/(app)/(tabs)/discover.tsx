import { SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { RoomCard } from '@/components/room-card';
import { useTranslation } from 'react-i18next';
import { useDiscoverFilters } from '@/context/discover-filters';
import { useRooms } from '@/services/rooms';
import type { DiscoverRoom } from '@/services/types';

export default function DiscoverScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.discover' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();

  const { filters } = useDiscoverFilters();
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
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <RoomCard room={item} />
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <View style={{ gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input
            className="flex-1"
            value={searchText}
            onChangeText={setSearchText}
            placeholder={tCommon('search')}
          />
          <Button
            variant="outline"
            size="icon"
            onPress={() => router.push('/(app)/filter-sheet' as never)}>
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : filteredRooms.length === 0 ? (
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
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
