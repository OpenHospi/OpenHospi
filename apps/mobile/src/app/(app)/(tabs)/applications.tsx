import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslations } from '@/i18n';
import { useApplications } from '@/services/applications';
import { useInvitations } from '@/services/invitations';
import type { UserApplication, UserInvitation } from '@/services/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

function ApplicationCard({ item, onPress }: { item: UserApplication; onPress: () => void }) {
  const tEnums = useTranslations('enums');
  const tCommon = useTranslations('common.labels');
  const t = useTranslations('app.applications');

  const coverUrl = item.roomCoverPhotoUrl
    ? `${SUPABASE_URL}/storage/v1/object/public/room-photos/${item.roomCoverPhotoUrl}`
    : null;

  return (
    <Pressable
      className="flex-row gap-3 rounded-xl border border-border bg-card p-3"
      onPress={onPress}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{ width: 80, height: 80, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : (
        <View className="h-20 w-20 items-center justify-center rounded-lg bg-muted">
          <Text className="text-2xl text-muted-foreground">&#x1F3E0;</Text>
        </View>
      )}
      <View className="flex-1 justify-center">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {item.roomTitle}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {tEnums(`city.${item.roomCity}`)} · \u20AC{item.roomRentPrice}
          {tCommon('perMonth')}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <View className="rounded-full bg-primary/10 px-2 py-0.5">
            <Text className="text-xs font-medium text-primary">
              {tEnums(`application_status.${item.status}`)}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {t('appliedOn', { date: new Date(item.appliedAt).toLocaleDateString() })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function InvitationCard({ item }: { item: UserInvitation }) {
  const tEnums = useTranslations('enums');
  const t = useTranslations('app.invitations');

  return (
    <View className="rounded-xl border border-border bg-card p-3">
      <Text className="text-base font-semibold text-foreground">{item.eventTitle}</Text>
      <Text className="text-sm text-muted-foreground">
        {item.eventDate} · {item.timeStart}
        {item.timeEnd ? ` - ${item.timeEnd}` : ''}
      </Text>
      <Text className="mt-1 text-sm text-muted-foreground">{item.roomTitle}</Text>
      {item.cancelledAt ? (
        <Text className="mt-1 text-sm text-destructive">{t('cancelled')}</Text>
      ) : (
        <View className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 self-start">
          <Text className="text-xs font-medium text-primary">
            {tEnums(`invitation_status.${item.status}`)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ApplicationsScreen() {
  const t = useTranslations('app.applications');
  const tInvitations = useTranslations('app.invitations');
  const router = useRouter();

  const [tab, setTab] = useState<'applications' | 'invitations'>('applications');

  const { data: applications, isPending: appsPending } = useApplications();
  const { data: invitations, isPending: invPending } = useInvitations();

  const renderApplication = useCallback(
    ({ item }: { item: UserApplication }) => (
      <View className="px-4 pb-3">
        <ApplicationCard
          item={item}
          onPress={() => router.push(`/(app)/application/${item.id}` as never)}
        />
      </View>
    ),
    [router],
  );

  const renderInvitation = useCallback(
    ({ item }: { item: UserInvitation }) => (
      <View className="px-4 pb-3">
        <InvitationCard item={item} />
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pb-2 pt-2">
        <Text className="text-xl font-bold text-foreground">{t('title')}</Text>

        <View className="mt-3 flex-row rounded-lg bg-muted p-1">
          <Pressable
            className={`flex-1 rounded-md py-2 ${tab === 'applications' ? 'bg-background shadow-sm' : ''}`}
            onPress={() => setTab('applications')}
          >
            <Text
              className={`text-center text-sm font-medium ${tab === 'applications' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {t('title')}
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 rounded-md py-2 ${tab === 'invitations' ? 'bg-background shadow-sm' : ''}`}
            onPress={() => setTab('invitations')}
          >
            <Text
              className={`text-center text-sm font-medium ${tab === 'invitations' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {tInvitations('title')}
            </Text>
          </Pressable>
        </View>
      </View>

      {tab === 'applications' ? (
        appsPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : !applications?.length ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-base text-muted-foreground">{t('empty')}</Text>
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplication}
            keyExtractor={(item) => item.id}
          />
        )
      ) : invPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : !invitations?.length ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-muted-foreground">
            {tInvitations('empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          renderItem={renderInvitation}
          keyExtractor={(item) => item.invitationId}
        />
      )}
    </SafeAreaView>
  );
}
