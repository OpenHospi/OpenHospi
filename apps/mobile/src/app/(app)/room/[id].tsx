import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { ApplySheet } from '@/components/apply-sheet';
import { PhotoCarousel } from '@/components/photo-carousel';
import { useTranslation } from 'react-i18next';
import { useRoom } from '@/services/rooms';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text variant="muted" className="text-sm">
        {label}
      </Text>
      <Text variant="small">{value}</Text>
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
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <Text variant="muted">{t('notFound')}</Text>
        <Button variant="link" className="mt-4" onPress={() => router.back()}>
          <Text>{t('backToDiscover')}</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const { room, application } = data;

  return (
    <SafeAreaView className="bg-background flex-1" edges={['bottom']}>
      <ScrollView className="flex-1">
        <PhotoCarousel photos={room.photos} supabaseUrl={SUPABASE_URL} bucket="room-photos" />

        <View className="px-4 pt-4">
          <Text variant="h3" className="text-left">
            {room.title}
          </Text>
          <Text variant="muted" className="mt-1">
            {tEnums(`city.${room.city}`)}
            {room.neighborhood ? ` \u00B7 ${room.neighborhood}` : ''}
          </Text>

          <Card className="mt-4">
            <CardContent>
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
              <DetailRow
                label={t('deposit')}
                value={room.deposit ? `\u20AC${room.deposit}` : null}
              />
              <Separator className="my-2" />
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold">{t('totalCost')}</Text>
                <Text className="text-primary text-lg font-bold">
                  \u20AC{room.totalCost}
                  {tCommon('perMonth')}
                </Text>
              </View>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t('details')}</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {room.features.length > 0 && (
            <View className="mt-4">
              <Text className="font-semibold">{t('features')}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {room.features.map((f) => (
                  <Badge key={f} variant="secondary" className="rounded-lg">
                    <Text>{tEnums(`room_feature.${f}`)}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {room.locationTags.length > 0 && (
            <View className="mt-4">
              <Text className="font-semibold">{t('locationTags')}</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {room.locationTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-lg">
                    <Text>{tEnums(`location_tag.${tag}`)}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t('whoWereLookingFor')}</CardTitle>
            </CardHeader>
            <CardContent>
              {room.preferredGender && room.preferredGender !== 'no_preference' ? (
                <DetailRow
                  label={tEnums('gender._label')}
                  value={tEnums(`gender.${room.preferredGender}`)}
                />
              ) : (
                <Text variant="muted" className="text-sm">
                  {t('everyoneWelcome')}
                </Text>
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
            </CardContent>
          </Card>

          {room.description && (
            <View className="mt-4">
              <Text className="font-semibold">{t('description')}</Text>
              <Text className="mt-2 text-sm leading-5">{room.description}</Text>
            </View>
          )}

          {room.owner && (
            <Card className="mt-4">
              <CardContent>
                <Text variant="muted" className="text-sm">
                  {t('postedBy')}
                </Text>
                <Text className="mt-1 font-medium">
                  {room.owner.firstName} {room.owner.lastName}
                </Text>
                {room.owner.studyProgram && (
                  <Text variant="muted" className="text-sm">
                    {room.owner.studyProgram}
                  </Text>
                )}
              </CardContent>
            </Card>
          )}

          <View className="h-24" />
        </View>
      </ScrollView>

      <View className="border-border bg-background absolute right-0 bottom-0 left-0 border-t px-4 pt-3 pb-4">
        {application ? (
          <Button
            variant="outline"
            className="rounded-xl py-3.5"
            onPress={() => router.push(`/(app)/application/${application.id}` as never)}>
            <Text>{t('viewApplication')}</Text>
          </Button>
        ) : (
          <Button className="rounded-xl py-3.5" onPress={() => setApplyVisible(true)}>
            <Text>{t('apply')}</Text>
          </Button>
        )}
      </View>

      <ApplySheet visible={applyVisible} onClose={() => setApplyVisible(false)} roomId={id} />
    </SafeAreaView>
  );
}
