import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { Dot } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { shadow } from '@/design/tokens/shadows';
import { LIST_ITEM_ENTERING } from '@/lib/animations';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { isAndroid, isIOS } from '@/lib/platform';
import type { DiscoverRoom } from '@openhospi/shared/api-types';

type Props = {
  room: DiscoverRoom;
};

export function RoomCard({ room }: Props) {
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
        accessibilityLabel={`${room.title}, ${room.totalCost} per month`}
        onPress={() => router.push({ pathname: '/(app)/room/[id]', params: { id: room.id } })}>
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
              {isIOS ? (
                <SymbolView name="house" size={32} tintColor={colors.tertiaryForeground} />
              ) : (
                <MaterialIcons name="home" size={32} color={colors.tertiaryForeground} />
              )}
            </View>
          )}

          <View style={styles.content}>
            <ThemedText variant="headline" numberOfLines={1}>
              {room.title}
            </ThemedText>

            <View style={styles.metaRow}>
              <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                {tEnums(`city.${room.city}`)}
              </ThemedText>
              {room.houseType && (
                <>
                  <Dot size={16} color={colors.tertiaryForeground} />
                  <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                    {tEnums(`house_type.${room.houseType}`)}
                  </ThemedText>
                </>
              )}
              {room.roomSizeM2 && (
                <>
                  <Dot size={16} color={colors.tertiaryForeground} />
                  <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                    {room.roomSizeM2}m²
                  </ThemedText>
                </>
              )}
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                {isIOS ? (
                  <SymbolView name="eurosign" size={18} tintColor={colors.primary} />
                ) : (
                  <MaterialIcons name="euro" size={18} color={colors.primary} />
                )}
                <ThemedText variant="title3" color={colors.primary}>
                  {room.totalCost}
                  {tCommon('perMonth')}
                </ThemedText>
              </View>
              {room.totalHousemates != null && (
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {tCommon('housemates', { count: room.totalHousemates })}
                </ThemedText>
              )}
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
