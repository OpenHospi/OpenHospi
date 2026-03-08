import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import { useApplicationDetail, useWithdrawApplication } from '@/services/applications';
import type { ApplicationStatus } from '@openhospi/shared/enums';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

const TIMELINE_STEPS: ApplicationStatus[] = ['sent', 'seen', 'liked', 'hospi', 'accepted'];

function StatusTimeline({ currentStatus }: { currentStatus: ApplicationStatus }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications.timeline' });

  const terminalStatuses = ['rejected', 'not_chosen', 'withdrawn'] as const;
  const isTerminal = (terminalStatuses as readonly string[]).includes(currentStatus);

  const currentIndex = TIMELINE_STEPS.indexOf(currentStatus);

  return (
    <View className="gap-0">
      {TIMELINE_STEPS.map((step, index) => {
        const isReached = currentIndex >= index;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <View key={step} className="flex-row">
            <View className="items-center" style={{ width: 24 }}>
              <View
                className={`h-3 w-3 rounded-full ${isReached ? 'bg-primary' : 'bg-muted'}`}
                style={{ marginTop: 4 }}
              />
              {!isLast && (
                <View
                  className={`w-0.5 flex-1 ${isReached ? 'bg-primary' : 'bg-muted'}`}
                  style={{ minHeight: 24 }}
                />
              )}
            </View>
            <Text
              className={`ml-2 pb-4 text-sm ${isReached ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
            >
              {t(step)}
            </Text>
          </View>
        );
      })}

      {isTerminal && (
        <View className="flex-row">
          <View className="items-center" style={{ width: 24 }}>
            <View className="h-3 w-3 rounded-full bg-destructive" style={{ marginTop: 4 }} />
          </View>
          <Text className="ml-2 text-sm font-medium text-destructive">{t(currentStatus)}</Text>
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
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-base text-muted-foreground">{t('errors.not_found')}</Text>
      </SafeAreaView>
    );
  }

  const coverUrl = app.roomCoverPhotoUrl
    ? `${SUPABASE_URL}/storage/v1/object/public/room-photos/${app.roomCoverPhotoUrl}`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: canWithdraw ? 80 : 16 }}
      >
        {/* Room header */}
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
          />
        ) : (
          <View className="h-[200px] w-full items-center justify-center bg-muted">
            <Text className="text-4xl text-muted-foreground">&#x1F3E0;</Text>
          </View>
        )}

        <View className="px-4 pt-4">
          {/* Room info */}
          <Text className="text-xl font-bold text-foreground">{app.roomTitle}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {tEnums(`city.${app.roomCity}`)}
            {app.roomHouseType ? ` · ${tEnums(`house_type.${app.roomHouseType}`)}` : ''}
            {app.roomSizeM2 ? ` · ${app.roomSizeM2}m\u00B2` : ''}
          </Text>
          <Text className="mt-1 text-lg font-bold text-primary">
            {'\u20AC'}
            {app.roomRentPrice}
            {tCommon('perMonth')}
          </Text>

          {/* Status badge */}
          <View className="mt-3 self-start rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-sm font-medium text-primary">
              {tEnums(`application_status.${app.status}`)}
            </Text>
          </View>

          <Text className="mt-1 text-xs text-muted-foreground">
            {t('appliedOn', { date: new Date(app.appliedAt).toLocaleDateString() })}
          </Text>

          {/* Timeline */}
          <View className="mt-6">
            <Text className="mb-3 text-base font-semibold text-foreground">
              {t('timeline.title')}
            </Text>
            <StatusTimeline currentStatus={app.status} />
          </View>

          {/* Personal message */}
          {app.personalMessage && (
            <View className="mt-6">
              <Text className="mb-2 text-base font-semibold text-foreground">
                {t('yourMessage')}
              </Text>
              <View className="rounded-lg bg-muted p-3">
                <Text className="text-sm text-foreground">{app.personalMessage}</Text>
              </View>
            </View>
          )}

          {/* View room button */}
          <Pressable
            className="mt-6 rounded-lg border border-border py-3"
            onPress={() => router.push(`/(app)/room/${app.roomId}`)}
          >
            <Text className="text-center text-sm font-medium text-foreground">{t('viewRoom')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky withdraw button */}
      {canWithdraw && (
        <View className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-4 pb-8 pt-3">
          <Pressable
            className="rounded-lg bg-destructive py-3"
            onPress={handleWithdraw}
            disabled={withdrawMutation.isPending}
          >
            <Text className="text-center text-sm font-semibold text-destructive-foreground">
              {withdrawMutation.isPending ? '...' : t('withdraw')}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
