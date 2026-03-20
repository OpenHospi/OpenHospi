import { INVITABLE_APPLICATION_STATUSES } from '@openhospi/shared/enums';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useBatchInvite, useRoomApplicants } from '@/services/my-rooms';
import type { RoomApplicant } from '@openhospi/shared/api-types';

export default function InviteApplicantsScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.invite' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });

  const { data: allApplicants, isLoading } = useRoomApplicants(id);
  const batchInvite = useBatchInvite();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const invitable = allApplicants?.filter((a) =>
    (INVITABLE_APPLICATION_STATUSES as readonly string[]).includes(a.status)
  );

  const toggleSelect = (applicationId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  };

  const selectAllLiked = () => {
    const liked = invitable?.filter((a) => a.status === 'liked') ?? [];
    setSelected(new Set(liked.map((a) => a.applicationId)));
  };

  const handleInvite = async () => {
    await batchInvite.mutateAsync({
      roomId: id,
      eventId,
      applicationIds: [...selected],
    });
    router.back();
  };

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  if (!invitable || invitable.length === 0) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
        className="bg-background">
        <Text variant="muted" className="text-center text-base">
          {t('noInvitable')}
        </Text>
      </View>
    );
  }

  const renderApplicant = ({ item }: { item: RoomApplicant }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;
    const isSelected = selected.has(item.applicationId);

    return (
      <Pressable onPress={() => toggleSelect(item.applicationId)}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}
          className="border-border border-b">
          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.applicationId)} />
          <View className="bg-muted overflow-hidden rounded-full" style={{ width: 40, height: 40 }}>
            {avatarUri && <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40 }} />}
          </View>
          <Text className="text-foreground text-sm" style={{ flex: 1 }}>
            {item.firstName} {item.lastName}
          </Text>
          <Badge variant="secondary">
            <Text>{tEnums(`application_status.${item.status}`)}</Text>
          </Badge>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View
        style={{
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        className="border-border border-b">
        <Text variant="muted" className="text-sm">
          {t('selected', { count: selected.size })}
        </Text>
        <Button variant="outline" size="sm" onPress={selectAllLiked}>
          <Text>{t('selectAllLiked')}</Text>
        </Button>
      </View>

      <FlatList
        data={invitable}
        keyExtractor={(item) => item.applicationId}
        renderItem={renderApplicant}
      />

      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button onPress={handleInvite} disabled={selected.size === 0 || batchInvite.isPending}>
          <Text>{t('submit', { count: selected.size })}</Text>
        </Button>
      </View>
    </View>
  );
}
