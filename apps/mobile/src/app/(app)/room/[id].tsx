import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dot, Euro } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { PhotoCarousel } from '@/components/photo-carousel';
import RoomLocationMap from '@/components/room-location-map';
import { useTranslation } from 'react-i18next';
import { useRoom } from '@/services/rooms';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: 6,
      }}>
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-card-foreground text-sm">{value}</Text>
    </View>
  );
}

function PriceValue({ amount }: { amount: string | number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Euro size={12} className="text-foreground" />
      <Text className="text-card-foreground text-sm">{amount}</Text>
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: 6,
      }}>
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
  const { t: tRoomFields } = useTranslation('translation', { keyPrefix: 'app.rooms.fields' });

  const insets = useSafeAreaInsets();
  const { data, isPending } = useRoom(id);

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <Text variant="muted">{t('notFound')}</Text>
        <Button variant="link" style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text>{t('backToDiscover')}</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const { room, application } = data;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['bottom']}>
      <ScrollView style={{ flex: 1 }}>
        <PhotoCarousel photos={room.photos} bucket="room-photos" />

        <View style={{ gap: 24, paddingHorizontal: 16, paddingTop: 16 }}>
          <View>
            <Text className="text-foreground text-2xl font-bold tracking-tight">{room.title}</Text>
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text className="text-card-foreground font-semibold">{t('totalCost')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                label={tRoomFields('roomSize')}
                value={room.roomSizeM2 ? t('roomSize', { size: String(room.roomSizeM2) }) : null}
              />
              <DetailRow
                label={tEnums('house_type._label')}
                value={room.houseType ? tEnums(`house_type.${room.houseType}`) : null}
              />
              <DetailRow
                label={tEnums('furnishing_label')}
                value={room.furnishing ? tEnums(`furnishing.${room.furnishing}`) : null}
              />
              <DetailRow
                label={t('rentalType')}
                value={room.rentalType ? tEnums(`rental_type.${room.rentalType}`) : null}
              />
              {room.availableFrom && (
                <DetailRow
                  label={t('availability')}
                  value={
                    t('availableFrom', { date: room.availableFrom }) +
                    (room.availableUntil
                      ? ` · ${t('availableUntil', { date: room.availableUntil })}`
                      : '')
                  }
                />
              )}
              {room.totalHousemates != null && (
                <DetailRow
                  label={tRoomFields('totalHousemates')}
                  value={tCommon('housemates', { count: Number(room.totalHousemates) })}
                />
              )}
            </CardContent>
          </Card>

          {room.features.length > 0 && (
            <View>
              <Text className="text-foreground font-semibold">{t('features')}</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
              <Text className="text-foreground font-semibold">{t('locationTags')}</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {room.locationTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-lg">
                    <Text>{tEnums(`location_tag.${tag}`)}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {room.latitude != null && room.longitude != null && (
            <View>
              <Text className="text-foreground font-semibold">{t('location')}</Text>
              <View style={{ marginTop: 8 }}>
                <RoomLocationMap latitude={room.latitude} longitude={room.longitude} />
              </View>
              <Text style={{ marginTop: 8 }} className="text-muted-foreground text-xs">
                {t('approximateLocation')}
              </Text>
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
              <Text className="text-foreground font-semibold">{t('description')}</Text>
              <Text style={{ marginTop: 8 }} className="text-foreground text-sm leading-5">
                {room.description}
              </Text>
            </View>
          )}

          {room.owner && (
            <Card>
              <CardContent>
                <Text className="text-muted-foreground text-sm">{t('postedBy')}</Text>
                <Text style={{ marginTop: 4 }} className="text-card-foreground font-medium">
                  {room.owner.firstName} {room.owner.lastName}
                </Text>
                {room.owner.studyProgram && (
                  <Text className="text-muted-foreground text-sm">{room.owner.studyProgram}</Text>
                )}
              </CardContent>
            </Card>
          )}

          <View style={{ height: 96 }} />
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
        className="border-border bg-background border-t">
        {application ? (
          <Button
            variant="outline"
            size="lg"
            style={{ height: 48 }}
            className="rounded-xl"
            onPress={() => router.push(`/(app)/application/${application.id}` as never)}>
            <Text className="text-base font-semibold">{t('viewApplication')}</Text>
          </Button>
        ) : (
          <Button
            size="lg"
            style={{ height: 48 }}
            className="rounded-xl"
            onPress={() =>
              router.push({ pathname: '/(app)/apply-sheet' as never, params: { roomId: id } })
            }>
            <Text className="text-base font-semibold">{t('apply')}</Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
