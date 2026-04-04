import { Stack } from 'expo-router';
import { Copy, RefreshCw, Share2, Users } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ErrorState } from '@/components/error-state';
import { SkeletonList } from '@/components/skeleton';
import { useMyHouse, useRegenerateInviteCode } from '@/services/house';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { HouseMemberRole } from '@openhospi/shared/enums';

export default function MyHouseScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.myHouse' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { data, isPending, isError, refetch } = useMyHouse();
  const regenerateCode = useRegenerateInviteCode();

  if (isPending) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background">
        <Stack.Screen options={{ title: t('title') }} />
        <SkeletonList count={3} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background">
        <Stack.Screen options={{ title: t('title') }} />
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!data?.house) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background">
        <Stack.Screen options={{ title: t('title') }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Users size={48} className="text-muted-foreground" />
          <Text className="text-muted-foreground mt-4 text-center">{t('noHouse')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { house, members, currentUserRole } = data;
  const isOwner = currentUserRole === HouseMemberRole.owner;
  const inviteLink = `https://openhospi.nl/join/${house.inviteCode}`;

  async function handleCopyCode() {
    await Clipboard.setStringAsync(inviteLink);
    Alert.alert(t('codeCopied'));
  }

  async function handleShareCode() {
    await Share.share({ message: inviteLink });
  }

  function handleRegenerateCode() {
    Alert.alert(t('regenerateTitle'), t('regenerateMessage'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('confirm'),
        style: 'destructive',
        onPress: () => regenerateCode.mutate(),
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <Stack.Screen options={{ title: t('title') }} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* House Name */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text className="text-foreground text-2xl font-bold">{house.name}</Text>
          <Text className="text-muted-foreground text-sm">
            {t('memberCount', { count: members.length })}
          </Text>
        </View>

        {/* Invite Code */}
        <View style={{ gap: 8 }} className="bg-card border-border rounded-xl border p-4">
          <Text className="text-foreground text-sm font-medium">{t('inviteCode')}</Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {inviteLink}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button variant="outline" size="sm" onPress={handleCopyCode} style={{ flex: 1 }}>
              <Copy size={14} className="text-foreground" />
              <Text>{tCommon('copy')}</Text>
            </Button>
            <Button variant="outline" size="sm" onPress={handleShareCode} style={{ flex: 1 }}>
              <Share2 size={14} className="text-foreground" />
              <Text>{tCommon('share')}</Text>
            </Button>
          </View>
          {isOwner && (
            <Pressable
              onPress={handleRegenerateCode}
              style={{ alignItems: 'center', paddingTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={12} className="text-muted-foreground" />
                <Text className="text-muted-foreground text-xs">{t('regenerateCode')}</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Members */}
        <View style={{ gap: 12 }}>
          <Text className="text-foreground text-base font-semibold">{t('members')}</Text>
          {members.map((member) => (
            <View
              key={member.userId}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              className="bg-card border-border rounded-xl border p-3">
              <Avatar alt={member.firstName}>
                {member.avatarUrl ? (
                  <AvatarImage
                    source={{ uri: getStoragePublicUrl(member.avatarUrl, 'profile-photos') }}
                  />
                ) : null}
                <AvatarFallback>
                  <Text>{member.firstName[0]?.toUpperCase() ?? '?'}</Text>
                </AvatarFallback>
              </Avatar>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground text-sm font-medium">
                  {member.firstName} {member.lastName}
                </Text>
              </View>
              <Badge variant={member.role === HouseMemberRole.owner ? 'default' : 'secondary'}>
                <Text>{tEnums(`houseMemberRole.${member.role}`)}</Text>
              </Badge>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
