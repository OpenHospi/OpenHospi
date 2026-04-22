import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
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
  const { colors } = useTheme();
  const coverUrl = room.coverPhotoUrl
    ? getStoragePublicUrl(room.coverPhotoUrl, 'room-photos')
    : null;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${room.title}, ${room.city}, ${room.totalCost} euro`}
      accessibilityHint="Opens room details"
      onPress={onPress}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        {coverUrl && (
          <Image
            source={{ uri: coverUrl }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
            transition={200}
          />
        )}
        <View style={styles.content}>
          <ThemedText variant="subheadline" weight="600" numberOfLines={1}>
            {room.title}
          </ThemedText>
          <ThemedText variant="caption1" color={colors.mutedForeground}>
            {room.city}
          </ThemedText>
          <View style={styles.priceRow}>
            <NativeIcon name="eurosign" size={14} color={colors.primary} />
            <ThemedText variant="subheadline" weight="700" color={colors.primary}>
              {room.totalCost}
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    width: 80,
    height: 60,
    borderRadius: radius.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
