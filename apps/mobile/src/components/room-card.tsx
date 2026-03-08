import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import type { DiscoverRoom } from '@/services/types';

type Props = {
  room: DiscoverRoom;
  supabaseUrl: string;
};

export function RoomCard({ room, supabaseUrl }: Props) {
  const router = useRouter();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const coverUrl = room.coverPhotoUrl
    ? `${supabaseUrl}/storage/v1/object/public/room-photos/${room.coverPhotoUrl}`
    : null;

  return (
    <Pressable onPress={() => router.push(`/(app)/room/${room.id}`)}>
      <Card className="overflow-hidden p-0">
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: 192 }}
            contentFit="cover"
            className="rounded-t-xl"
          />
        ) : (
          <View className="bg-muted h-48 w-full items-center justify-center rounded-t-xl">
            <Home size={32} className="text-muted-foreground" />
          </View>
        )}

        <View className="p-4">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {room.title}
          </Text>

          <Text variant="muted" className="mt-1 text-sm">
            {tEnums(`city.${room.city}`)}
            {room.houseType ? ` \u00B7 ${tEnums(`house_type.${room.houseType}`)}` : ''}
            {room.roomSizeM2 ? ` \u00B7 ${room.roomSizeM2}m\u00B2` : ''}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-primary text-lg font-bold">
              \u20AC{room.totalCost}
              {tCommon('perMonth')}
            </Text>
            {room.totalHousemates != null && (
              <Text variant="muted" className="text-xs">
                {tCommon('housemates', { count: room.totalHousemates })}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
