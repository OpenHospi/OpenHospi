import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dot, Euro, Home } from 'lucide-react-native';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HospiInvitationCard } from '@/components/hospi-invitation-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useApplicationDetail, useWithdrawApplication } from '@/services/applications';
import type { ApplicationStatus } from '@openhospi/shared/enums';

const TIMELINE_STEPS: ApplicationStatus[] = ['sent', 'seen', 'liked', 'hospi', 'accepted'];

function StatusTimeline({ currentStatus }: { currentStatus: ApplicationStatus }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications.timeline' });

  const terminalStatuses = ['rejected', 'not_chosen', 'withdrawn'] as const;
  const isTerminal = (terminalStatuses as readonly string[]).includes(currentStatus);

  const currentIndex = TIMELINE_STEPS.indexOf(currentStatus);

  return (
    <View style={{ gap: 0 }}>
      {TIMELINE_STEPS.map((step, index) => {
        const isReached = currentIndex >= index;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <View key={step} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 24 }}>
              <View
                className={`h-3 w-3 rounded-full ${isReached ? 'bg-primary' : 'bg-muted'}`}
                style={{ marginTop: 4 }}
              />
              {!isLast && (
                <View
                  className={`w-0.5 ${isReached ? 'bg-primary' : 'bg-muted'}`}
                  style={{ flex: 1, minHeight: 24 }}
                />
              )}
            </View>
            <Text
              style={{ marginLeft: 8, paddingBottom: 16 }}
              className={`text-sm ${isReached ? 'font-medium' : 'text-muted-foreground'}`}>
              {t(step)}
            </Text>
          </View>
        );
      })}

      {isTerminal && (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ alignItems: 'center', width: 24 }}>
            <View className="bg-destructive h-3 w-3 rounded-full" style={{ marginTop: 4 }} />
          </View>
          <Text style={{ marginLeft: 8 }} className="text-destructive text-sm font-medium">
            {t(currentStatus)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: app, isPending } = useApplicationDetail(id);
  const withdrawMutation = useWithdrawApplication();

  const canWithdraw =
    app && !(['rejected', 'accepted', 'not_chosen', 'withdrawn'] as string[]).includes(app.status);

  const handleWithdraw = () => {
    Alert.alert(t('withdrawConfirmTitle'), t('withdrawConfirmDescription'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('withdraw'),
        style: 'destructive',
        onPress: () => {
          withdrawMutation.mutate(id, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  };

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        className="bg-background">
        <Text variant="muted" className="text-center">
          {t('errors.not_found')}
        </Text>
      </SafeAreaView>
    );
  }

  const coverUrl = app.roomCoverPhotoUrl
    ? getStoragePublicUrl(app.roomCoverPhotoUrl, 'room-photos')
    : null;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: canWithdraw ? 80 : 16 }}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              height: 200,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="bg-muted">
            <Home size={48} className="text-muted-foreground" />
          </View>
        )}

        <View style={{ gap: 24, paddingHorizontal: 16, paddingTop: 16 }}>
          <View>
            <Text className="text-foreground text-2xl font-bold tracking-tight">
              {app.roomTitle}
            </Text>
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="muted">{tEnums(`city.${app.roomCity}`)}</Text>
              {app.roomHouseType && (
                <>
                  <Dot size={16} className="text-muted-foreground" />
                  <Text variant="muted">{tEnums(`house_type.${app.roomHouseType}`)}</Text>
                </>
              )}
              {app.roomSizeM2 && (
                <>
                  <Dot size={16} className="text-muted-foreground" />
                  <Text variant="muted">{app.roomSizeM2}m²</Text>
                </>
              )}
            </View>
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
              <Euro size={18} className="text-primary" />
              <Text className="text-primary text-lg font-bold">
                {app.roomRentPrice}
                {tCommon('perMonth')}
              </Text>
            </View>
          </View>

          <View>
            <Badge variant="secondary" style={{ alignSelf: 'flex-start' }} className="rounded-full">
              <Text>{tEnums(`application_status.${app.status}`)}</Text>
            </Badge>
            <Text variant="muted" style={{ marginTop: 4 }} className="text-xs">
              {t('appliedOn', { date: new Date(app.appliedAt).toLocaleDateString() })}
            </Text>
          </View>

          <View>
            <Text style={{ marginBottom: 12 }} className="text-foreground font-semibold">
              {t('timeline.title')}
            </Text>
            <StatusTimeline currentStatus={app.status} />
          </View>

          {app.invitation && (
            <HospiInvitationCard invitation={app.invitation} applicationId={app.id} />
          )}

          {app.personalMessage && (
            <View>
              <Text style={{ marginBottom: 8 }} className="text-foreground font-semibold">
                {t('yourMessage')}
              </Text>
              <Card>
                <CardContent>
                  <Text className="text-card-foreground text-sm">{app.personalMessage}</Text>
                </CardContent>
              </Card>
            </View>
          )}

          <Button variant="outline" onPress={() => router.push(`/(app)/room/${app.roomId}`)}>
            <Text>{t('viewRoom')}</Text>
          </Button>
        </View>
      </ScrollView>

      {canWithdraw && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32,
          }}
          className="border-border bg-background border-t">
          <Button
            variant="destructive"
            onPress={handleWithdraw}
            disabled={withdrawMutation.isPending}>
            <Text>{withdrawMutation.isPending ? '...' : t('withdraw')}</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
