import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Euro, Home, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { RoomStatus } from '@openhospi/shared/enums';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import { getStoragePublicUrl } from '@/lib/storage-url';
import type { MyRoomSummary } from '@/services/types';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [RoomStatus.active]: 'default',
  [RoomStatus.draft]: 'outline',
  [RoomStatus.paused]: 'secondary',
  [RoomStatus.closed]: 'destructive',
};

type Props = {
  room: MyRoomSummary;
};

export function MyRoomCard({ room }: Props) {
  const router = useRouter();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const coverUrl = room.coverPhotoUrl
    ? getStoragePublicUrl(room.coverPhotoUrl, 'room-photos')
    : null;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/(tabs)/my-rooms/[id]', params: { id: room.id } })
      }>
      <Card style={{ padding: 0, gap: 0, paddingVertical: 0 }} className="overflow-hidden">
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ aspectRatio: 4 / 3, width: '100%' }}
            className="rounded-t-xl"
            contentFit="cover"
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
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              className="text-card-foreground text-base font-semibold"
              numberOfLines={1}
              style={{ flex: 1 }}>
              {room.title || tEnums('room_status.draft')}
            </Text>
            <Badge variant={STATUS_BADGE_VARIANT[room.status] ?? 'outline'} className="ml-2">
              <Text>{tEnums(`room_status.${room.status}`)}</Text>
            </Badge>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="muted" className="text-sm">
              {tEnums(`city.${room.city}`)}
            </Text>
          </View>

          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Euro size={18} className="text-primary" />
              <Text className="text-primary text-lg font-bold">
                {room.totalCost}
                {tCommon('perMonth')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Users size={14} className="text-muted-foreground" />
              <Text variant="muted" className="text-xs">
                {room.applicantCount}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
