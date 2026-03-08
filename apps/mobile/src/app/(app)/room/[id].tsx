import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApplySheet } from '@/components/apply-sheet';
import { PhotoCarousel } from '@/components/photo-carousel';
import { useTranslation } from 'react-i18next';
import { useRoom } from '@/services/rooms';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.roomDetail' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data, isPending } = useRoom(id);
  const [applyVisible, setApplyVisible] = useState(false);

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-base text-muted-foreground">{t('notFound')}</Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary">{t('backToDiscover')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { room, application } = data;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1">
        <PhotoCarousel photos={room.photos} supabaseUrl={SUPABASE_URL} bucket="room-photos" />

        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-foreground">{room.title}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {tEnums(`city.${room.city}`)}
            {room.neighborhood ? ` \u00B7 ${room.neighborhood}` : ''}
          </Text>

          {/* Cost breakdown */}
          <View className="mt-4 rounded-xl border border-border bg-card p-4">
            <DetailRow label={t('rent')} value={`\u20AC${room.rentPrice}`} />
            <DetailRow
              label={t('serviceCosts')}
              value={room.serviceCosts ? `\u20AC${room.serviceCosts}` : null}
            />
            <DetailRow
              label={t('utilitiesIncluded')}
              value={
                room.utilitiesIncluded
                  ? tEnums(`utilities_included.${room.utilitiesIncluded}`)
                  : null
              }
            />
            <DetailRow label={t('deposit')} value={room.deposit ? `\u20AC${room.deposit}` : null} />
            <View className="mt-1 border-t border-border pt-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">{t('totalCost')}</Text>
                <Text className="text-lg font-bold text-primary">
                  \u20AC{room.totalCost}
                  {tCommon('perMonth')}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View className="mt-4 rounded-xl border border-border bg-card p-4">
            <Text className="mb-2 text-base font-semibold text-foreground">{t('details')}</Text>
            <DetailRow
              label={t('roomSize')}
              value={room.roomSizeM2 ? `${room.roomSizeM2}m\u00B2` : null}
            />
            <DetailRow
              label={tEnums('house_type._label')}
              value={room.houseType ? tEnums(`house_type.${room.houseType}`) : null}
            />
            <DetailRow
              label={tEnums('furnishing._label')}
              value={room.furnishing ? tEnums(`furnishing.${room.furnishing}`) : null}
            />
            <DetailRow
              label={tEnums('rental_type._label')}
              value={room.rentalType ? tEnums(`rental_type.${room.rentalType}`) : null}
            />
            <DetailRow label={t('availableFrom')} value={room.availableFrom} />
            <DetailRow label={t('availableUntil')} value={room.availableUntil} />
            {room.totalHousemates != null && (
              <DetailRow
                label={tCommon('housemates', { count: 0 }).replace('0 ', '')}
                value={String(room.totalHousemates)}
              />
            )}
          </View>

          {/* Features */}
          {room.features.length > 0 && (
            <View className="mt-4">
              <Text className="text-base font-semibold text-foreground">{t('features')}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {room.features.map((f) => (
                  <View key={f} className="rounded-lg bg-primary/10 px-3 py-1.5">
                    <Text className="text-sm text-primary">{tEnums(`room_feature.${f}`)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Location tags */}
          {room.locationTags.length > 0 && (
            <View className="mt-4">
              <Text className="text-base font-semibold text-foreground">{t('locationTags')}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {room.locationTags.map((tag) => (
                  <View key={tag} className="rounded-lg bg-secondary px-3 py-1.5">
                    <Text className="text-sm text-secondary-foreground">
                      {tEnums(`location_tag.${tag}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Who we're looking for */}
          <View className="mt-4 rounded-xl border border-border bg-card p-4">
            <Text className="mb-2 text-base font-semibold text-foreground">
              {t('whoWereLookingFor')}
            </Text>
            {room.preferredGender && room.preferredGender !== 'no_preference' ? (
              <DetailRow
                label={tEnums('gender._label')}
                value={tEnums(`gender.${room.preferredGender}`)}
              />
            ) : (
              <Text className="text-sm text-muted-foreground">{t('everyoneWelcome')}</Text>
            )}
            {(room.preferredAgeMin || room.preferredAgeMax) && (
              <DetailRow
                label={t('ageRange')}
                value={`${room.preferredAgeMin ?? '?'} - ${room.preferredAgeMax ?? '?'}`}
              />
            )}
            {room.acceptedLanguages.length > 0 && (
              <DetailRow
                label={t('acceptedLanguages')}
                value={room.acceptedLanguages.map((l) => tEnums(`language_enum.${l}`)).join(', ')}
              />
            )}
          </View>

          {/* Description */}
          {room.description && (
            <View className="mt-4">
              <Text className="text-base font-semibold text-foreground">{t('description')}</Text>
              <Text className="mt-2 text-sm leading-5 text-foreground">{room.description}</Text>
            </View>
          )}

          {/* Posted by */}
          {room.owner && (
            <View className="mt-4 rounded-xl border border-border bg-card p-4">
              <Text className="text-sm text-muted-foreground">{t('postedBy')}</Text>
              <Text className="mt-1 text-base font-medium text-foreground">
                {room.owner.firstName} {room.owner.lastName}
              </Text>
              {room.owner.studyProgram && (
                <Text className="text-sm text-muted-foreground">{room.owner.studyProgram}</Text>
              )}
            </View>
          )}

          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Sticky apply button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 pb-4 pt-3">
        {application ? (
          <Pressable
            className="items-center rounded-xl border border-primary bg-primary/10 py-3.5"
            onPress={() => router.push(`/(app)/application/${application.id}` as never)}
          >
            <Text className="text-base font-semibold text-primary">{t('viewApplication')}</Text>
          </Pressable>
        ) : (
          <Pressable
            className="items-center rounded-xl bg-primary py-3.5 active:opacity-80"
            onPress={() => setApplyVisible(true)}
          >
            <Text className="text-base font-semibold text-primary-foreground">{t('apply')}</Text>
          </Pressable>
        )}
      </View>

      <ApplySheet visible={applyVisible} onClose={() => setApplyVisible(false)} roomId={id} />
    </SafeAreaView>
  );
}
