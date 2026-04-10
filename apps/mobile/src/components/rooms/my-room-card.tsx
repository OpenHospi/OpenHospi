import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Euro, Home, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { RoomStatus } from '@openhospi/shared/enums';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { ThemedText } from '@/components/primitives/themed-text';
import { StatusPill } from '@/components/layout/status-pill';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';
import { LIST_ITEM_ENTERING } from '@/lib/animations';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { isAndroid } from '@/lib/platform';
import type { MyRoomSummary } from '@openhospi/shared/api-types';

const STATUS_PILL_COLOR: Record<
  string,
  'primary' | 'success' | 'warning' | 'destructive' | 'muted'
> = {
  [RoomStatus.active]: 'success',
  [RoomStatus.draft]: 'muted',
  [RoomStatus.paused]: 'warning',
  [RoomStatus.closed]: 'destructive',
};

type Props = {
  room: MyRoomSummary;
};

export function MyRoomCard({ room }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const coverUrl = room.coverPhotoUrl
    ? getStoragePublicUrl(room.coverPhotoUrl, 'room-photos')
    : null;

  return (
    <Animated.View entering={LIST_ITEM_ENTERING}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`${room.title}, ${tEnums(`room_status.${room.status}`)}`}
        onPress={() =>
          router.push({ pathname: '/(app)/(tabs)/my-rooms/[id]', params: { id: room.id } })
        }>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.tertiaryBackground,
              borderRadius: radius.lg,
            },
            isAndroid ? shadow('sm') : undefined,
          ]}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={[
                styles.coverImage,
                { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
              ]}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.coverPlaceholder,
                {
                  backgroundColor: colors.muted,
                  borderTopLeftRadius: radius.lg,
                  borderTopRightRadius: radius.lg,
                },
              ]}>
              <Home size={32} color={colors.tertiaryForeground} />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <ThemedText variant="headline" numberOfLines={1} style={styles.titleText}>
                {room.title || tEnums('room_status.draft')}
              </ThemedText>
              <StatusPill
                label={tEnums(`room_status.${room.status}`)}
                color={STATUS_PILL_COLOR[room.status] ?? 'muted'}
              />
            </View>

            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {tEnums(`city.${room.city}`)}
            </ThemedText>

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Euro size={18} color={colors.primary} />
                <ThemedText variant="title3" color={colors.primary}>
                  {room.totalCost}
                  {tCommon('perMonth')}
                </ThemedText>
              </View>
              <View style={styles.applicantCount}>
                <Users size={14} color={colors.tertiaryForeground} />
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {room.applicantCount}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  coverImage: {
    aspectRatio: 4 / 3,
    width: '100%',
  },
  coverPlaceholder: {
    aspectRatio: 4 / 3,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 8,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
