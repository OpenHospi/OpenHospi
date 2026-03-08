import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dot, Euro, Home } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useApplications } from '@/services/applications';
import { useInvitations } from '@/services/invitations';
import { getStoragePublicUrl } from '@/lib/storage-url';
import type { UserApplication, UserInvitation } from '@/services/types';

function ApplicationCard({ item, onPress }: { item: UserApplication; onPress: () => void }) {
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });

  const coverUrl = item.roomCoverPhotoUrl
    ? getStoragePublicUrl(item.roomCoverPhotoUrl, 'room-photos')
    : null;

  return (
    <Pressable onPress={onPress}>
      <Card className="flex-row gap-3 p-3">
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
            contentFit="cover"
          />
        ) : (
          <View className="bg-muted h-20 w-20 items-center justify-center rounded-lg">
            <Home size={24} className="text-muted-foreground" />
          </View>
        )}
        <View className="flex-1 justify-center gap-1">
          <Text className="font-semibold" numberOfLines={1}>
            {item.roomTitle}
          </Text>
          <View className="flex-row items-center">
            <Text variant="muted" className="text-sm">
              {tEnums(`city.${item.roomCity}`)}
            </Text>
            <Dot size={14} className="text-muted-foreground" />
            <Euro size={12} className="text-muted-foreground" />
            <Text variant="muted" className="text-sm">
              {item.roomRentPrice}
              {tCommon('perMonth')}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              <Text>{tEnums(`application_status.${item.status}`)}</Text>
            </Badge>
            <Text variant="muted" className="text-xs">
              {t('appliedOn', { date: new Date(item.appliedAt).toLocaleDateString() })}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function InvitationCard({ item }: { item: UserInvitation }) {
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.invitations' });

  return (
    <Card className="space-y-1 p-3">
      <Text className="font-semibold">{item.eventTitle}</Text>
      <View className="flex-row items-center">
        <Text variant="muted" className="text-sm">
          {item.eventDate}
        </Text>
        <Dot size={14} className="text-muted-foreground" />
        <Text variant="muted" className="text-sm">
          {item.timeStart}
          {item.timeEnd ? ` - ${item.timeEnd}` : ''}
        </Text>
      </View>
      <Text variant="muted" className="text-sm">
        {item.roomTitle}
      </Text>
      {item.cancelledAt ? (
        <Text className="text-destructive text-sm">{t('cancelled')}</Text>
      ) : (
        <Badge variant="secondary" className="self-start rounded-full">
          <Text>{tEnums(`invitation_status.${item.status}`)}</Text>
        </Badge>
      )}
    </Card>
  );
}

export default function ApplicationsScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tInvitations } = useTranslation('translation', { keyPrefix: 'app.invitations' });
  const router = useRouter();

  const [tab, setTab] = useState('applications');
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
    [router]
  );

  const renderInvitation = useCallback(
    ({ item }: { item: UserInvitation }) => (
      <View className="px-4 pb-3">
        <InvitationCard item={item} />
      </View>
    ),
    []
  );

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top']}>
      <View className="px-4 pt-2 pb-2">
        <Text className="text-2xl font-bold tracking-tight">{t('title')}</Text>
      </View>

      <Tabs value={tab} onValueChange={setTab} className="flex-1">
        <View className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="applications" className="flex-1">
              <Text>{t('title')}</Text>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex-1">
              <Text>{tInvitations('title')}</Text>
            </TabsTrigger>
          </TabsList>
        </View>

        <TabsContent value="applications" className="flex-1 pt-2">
          {appsPending ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          ) : !applications?.length ? (
            <View className="flex-1 items-center justify-center px-8">
              <View className="items-center justify-center rounded-lg border border-dashed p-12">
                <Text variant="muted" className="text-center">
                  {t('empty')}
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={applications}
              renderItem={renderApplication}
              keyExtractor={(item) => item.id}
            />
          )}
        </TabsContent>

        <TabsContent value="invitations" className="flex-1 pt-2">
          {invPending ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          ) : !invitations?.length ? (
            <View className="flex-1 items-center justify-center px-8">
              <View className="items-center justify-center rounded-lg border border-dashed p-12">
                <Text variant="muted" className="text-center">
                  {tInvitations('empty')}
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={invitations}
              renderItem={renderInvitation}
              keyExtractor={(item) => item.invitationId}
            />
          )}
        </TabsContent>
      </Tabs>
    </SafeAreaView>
  );
}
