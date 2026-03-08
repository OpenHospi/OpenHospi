import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
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
    <Pressable
      className="overflow-hidden rounded-xl border border-border bg-card"
      onPress={() => router.push(`/(app)/room/${room.id}`)}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{ width: '100%', height: 180 }}
          contentFit="cover"
        />
      ) : (
        <View className="h-[180px] w-full items-center justify-center bg-muted">
          <Text className="text-3xl text-muted-foreground">&#x1F3E0;</Text>
        </View>
      )}

      <View className="p-3">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {room.title}
        </Text>

        <Text className="mt-0.5 text-sm text-muted-foreground">
          {tEnums(`city.${room.city}`)}
          {room.houseType ? ` \u00B7 ${tEnums(`house_type.${room.houseType}`)}` : ''}
          {room.roomSizeM2 ? ` \u00B7 ${room.roomSizeM2}m\u00B2` : ''}
        </Text>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-primary">
            \u20AC{room.totalCost}
            {tCommon('perMonth')}
          </Text>
          {room.totalHousemates != null && (
            <Text className="text-xs text-muted-foreground">
              {tCommon('housemates', { count: room.totalHousemates })}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
