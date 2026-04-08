import { Image } from 'expo-image';
import { Euro } from 'lucide-react-native';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';

type RoomMapCardRoom = {
  id: string;
  title: string;
  coverPhotoUrl: string | null;
  city: string;
  totalCost: number;
};

type Props = {
  room: RoomMapCardRoom;
  onPress: () => void;
};

export function RoomMapCard({ room, onPress }: Props) {
  const coverUrl = room.coverPhotoUrl
    ? getStoragePublicUrl(room.coverPhotoUrl, 'room-photos')
    : null;

  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          padding: 12,
          borderRadius: 12,
        }}
        className="bg-card border-border border">
        {coverUrl && (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: 80, height: 60, borderRadius: 8 }}
            contentFit="cover"
            cachePolicy="disk"
            transition={200}
          />
        )}
        <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
          <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
            {room.title}
          </Text>
          <Text className="text-muted-foreground text-xs">{room.city}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Euro size={14} className="text-primary" />
            <Text className="text-primary text-sm font-bold">{room.totalCost}</Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}
