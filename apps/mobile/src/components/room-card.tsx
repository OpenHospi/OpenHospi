import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dot, Euro, Home } from 'lucide-react-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { LIST_ITEM_ENTERING } from '@/lib/animations';
import { getStoragePublicUrl } from '@/lib/storage-url';
import type { DiscoverRoom } from '@openhospi/shared/api-types';

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
    <Animated.View entering={LIST_ITEM_ENTERING}>
      <AnimatedPressable
        onPress={() => router.push({ pathname: '/(app)/room/[id]', params: { id: room.id } })}>
        <Card style={{ padding: 0, gap: 0, paddingVertical: 0 }} className="overflow-hidden">
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ aspectRatio: 4 / 3, width: '100%' }}
              className="rounded-t-xl"
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          ) : (
            <View
              style={{
                aspectRatio: 4 / 3,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="bg-muted rounded-t-xl">
              <Home size={32} className="text-muted-foreground" />
            </View>
          )}

          <View style={{ gap: 8, padding: 16 }}>
            <Text className="text-card-foreground text-base font-semibold" numberOfLines={1}>
              {room.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
      </AnimatedPressable>
    </Animated.View>
  );
}
