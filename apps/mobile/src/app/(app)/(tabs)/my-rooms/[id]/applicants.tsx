import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useMarkApplicationsSeen, useRoomApplicants } from '@/services/my-rooms';
import type { RoomApplicant } from '@openhospi/shared/api-types';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  sent: 'outline',
  seen: 'secondary',
  liked: 'default',
  maybe: 'secondary',
  rejected: 'destructive',
  hospi: 'default',
  accepted: 'default',
  not_chosen: 'destructive',
};

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.applicants' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });

  const { data: applicants, isLoading } = useRoomApplicants(id);
  const markSeen = useMarkApplicationsSeen();
  const markedRef = useRef(false);

  useEffect(() => {
    if (!markedRef.current && applicants?.some((a) => a.status === 'sent')) {
      markedRef.current = true;
      markSeen.mutate(id);
    }
  }, [applicants, id, markSeen]);

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  if (!applicants || applicants.length === 0) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
        className="bg-background">
        <Text variant="muted" className="text-center text-base">
          {t('empty')}
        </Text>
      </View>
    );
  }

  const renderApplicant = ({ item }: { item: RoomApplicant }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/my-rooms/[id]/applicant/[applicantUserId]',
            params: { id, applicantUserId: item.userId },
          })
        }>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            gap: 12,
          }}
          className="border-border border-b">
          <View className="bg-muted overflow-hidden rounded-full" style={{ width: 48, height: 48 }}>
            {avatarUri && <Image source={{ uri: avatarUri }} style={{ width: 48, height: 48 }} />}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text className="text-foreground font-semibold">
              {item.firstName} {item.lastName}
            </Text>
            {item.studyProgram && (
              <Text variant="muted" className="text-sm">
                {item.studyProgram}
              </Text>
            )}
            <Text variant="muted" className="text-xs">
              {t('applied')} {new Date(item.appliedAt).toLocaleDateString()}
            </Text>
          </View>
          <Badge variant={STATUS_BADGE_VARIANT[item.status] ?? 'outline'}>
            <Text>{tEnums(`application_status.${item.status}`)}</Text>
          </Badge>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <FlatList
        data={applicants}
        keyExtractor={(item) => item.applicationId}
        renderItem={renderApplicant}
      />
    </View>
  );
}
