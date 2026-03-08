import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dot, Euro } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { PhotoCarousel } from '@/components/photo-carousel';
import { useTranslation } from 'react-i18next';
import { useRoom } from '@/services/rooms';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-sm">{value}</Text>
    </View>
  );
}

function PriceValue({ amount }: { amount: string | number }) {
  return (
    <View className="flex-row items-center">
      <Euro size={12} className="text-foreground" />
      <Text className="text-sm">{amount}</Text>
    </View>
  );
}

function PriceDetailRow({
  label,
  amount,
}: {
  label: string;
  amount: string | number | null | undefined;
}) {
  if (!amount) return null;
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <PriceValue amount={amount} />
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
        <PhotoCarousel photos={room.photos} bucket="room-photos" />

        <View className="space-y-6 px-4 pt-4">
          <View>
            <Text className="text-2xl font-bold tracking-tight">{room.title}</Text>
            <View className="mt-1 flex-row items-center">
              <Text variant="muted">{tEnums(`city.${room.city}`)}</Text>
              {room.neighborhood && (
                <>
                  <Dot size={16} className="text-muted-foreground" />
                  <Text variant="muted">{room.neighborhood}</Text>
                </>
              )}
            </View>
          </View>

          <Card>
            <CardContent>
              <PriceDetailRow label={t('rent')} amount={room.rentPrice} />
              <PriceDetailRow label={t('serviceCosts')} amount={room.serviceCosts} />
              <DetailRow
                label={t('utilitiesIncluded')}
                value={
                  room.utilitiesIncluded
                    ? tEnums(`utilities_included.${room.utilitiesIncluded}`)
                    : null
                }
              />
              <PriceDetailRow label={t('deposit')} amount={room.deposit} />
              <Separator className="my-2" />
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold">{t('totalCost')}</Text>
                <View className="flex-row items-center">
                  <Euro size={18} className="text-primary" />
                  <Text className="text-primary text-lg font-bold">
                    {room.totalCost}
                    {tCommon('perMonth')}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label={t('roomSize')}
                value={room.roomSizeM2 ? `${room.roomSizeM2}m²` : null}
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
            <View>
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
            <View>
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

          <Card>
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
            <View>
              <Text className="font-semibold">{t('description')}</Text>
              <Text className="mt-2 text-sm leading-5">{room.description}</Text>
            </View>
          )}

          {room.owner && (
            <Card>
              <CardContent>
                <Text className="text-muted-foreground text-sm">{t('postedBy')}</Text>
                <Text className="mt-1 font-medium">
                  {room.owner.firstName} {room.owner.lastName}
                </Text>
                {room.owner.studyProgram && (
                  <Text className="text-muted-foreground text-sm">{room.owner.studyProgram}</Text>
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
          <Button
            className="rounded-xl py-3.5"
            onPress={() =>
              router.push({ pathname: '/(app)/apply-sheet' as never, params: { roomId: id } })
            }>
            <Text>{t('apply')}</Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
