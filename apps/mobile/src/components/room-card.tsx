import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dot, Euro, Home } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import type { DiscoverRoom } from '@/services/types';

type Props = {
  room: DiscoverRoom;
};

export function RoomCard({ room }: Props) {
  const router = useRouter();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const coverUrl = room.coverPhotoUrl
    ? getStoragePublicUrl(room.coverPhotoUrl, 'room-photos')
    : null;

  return (
    <Pressable onPress={() => router.push(`/(app)/room/${room.id}`)}>
      <Card className="overflow-hidden p-0">
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            className="aspect-[4/3] w-full rounded-t-xl"
            contentFit="cover"
          />
        ) : (
          <View className="bg-muted aspect-[4/3] w-full items-center justify-center rounded-t-xl">
            <Home size={32} className="text-muted-foreground" />
          </View>
        )}

        <View className="space-y-2 p-4">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {room.title}
          </Text>

          <View className="flex-row items-center">
            <Text variant="muted" className="text-sm">
              {tEnums(`city.${room.city}`)}
            </Text>
            {room.houseType && (
              <>
                <Dot size={16} className="text-muted-foreground" />
                <Text variant="muted" className="text-sm">
                  {tEnums(`house_type.${room.houseType}`)}
                </Text>
              </>
            )}
            {room.roomSizeM2 && (
              <>
                <Dot size={16} className="text-muted-foreground" />
                <Text variant="muted" className="text-sm">
                  {room.roomSizeM2}m²
                </Text>
              </>
            )}
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Euro size={18} className="text-primary" />
              <Text className="text-primary text-lg font-bold">
                {room.totalCost}
                {tCommon('perMonth')}
              </Text>
            </View>
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
