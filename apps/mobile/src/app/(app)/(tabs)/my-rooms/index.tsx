import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MyRoomCard } from '@/components/my-room-card';
import { Text } from '@/components/ui/text';
import { useMyRooms } from '@/services/my-rooms';

export default function MyRoomsListScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const router = useRouter();
  const { data: rooms, isLoading, refetch, isRefetching } = useMyRooms();

  const navigateToCreate = () => {
    router.push('/(app)/(tabs)/my-rooms/create/house-gate');
  };

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  if (!rooms?.length) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        className="bg-background">
        <View
          style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}
          className="rounded-lg border border-dashed">
          <Home size={32} className="text-muted-foreground" />
          <Text style={{ marginTop: 16 }} className="text-foreground text-lg font-semibold">
            {t('title')}
          </Text>
          <Text variant="muted" style={{ marginTop: 4 }} className="text-center text-sm">
            {t('empty')}
          </Text>
          <Pressable
            onPress={navigateToCreate}
            style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12 }}
            className="bg-primary rounded-lg">
            <Text className="text-primary-foreground font-semibold">{t('createFirst')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MyRoomCard room={item} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </View>
  );
}
