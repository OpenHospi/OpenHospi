import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useCloseRoom, useCloseRoomApplicants } from '@/services/my-rooms';

export default function CloseRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.closeRoom' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: applicants, isLoading } = useCloseRoomApplicants(id);
  const closeRoom = useCloseRoom();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  const handleClose = (withChoice: boolean) => {
    const title = t('confirmTitle');
    const message = withChoice ? t('confirmWithChoice') : t('confirmWithoutChoice');

    Alert.alert(title, message, [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        style: 'destructive',
        onPress: async () => {
          await closeRoom.mutateAsync({
            roomId: id,
            chosenApplicationId: withChoice ? (selectedId ?? undefined) : undefined,
          });
          router.replace('/(app)/(tabs)/my-rooms');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-foreground text-sm">{t('description')}</Text>

        {applicants && applicants.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text className="text-foreground font-semibold">{t('chooseApplicant')}</Text>
            <Text variant="muted" className="text-sm">
              {t('chooseHint')}
            </Text>

            {applicants.map((applicant) => {
              const avatarUri = applicant.avatarUrl
                ? getStoragePublicUrl(applicant.avatarUrl, 'profile-photos')
                : undefined;
              const isSelected = selectedId === applicant.applicationId;

              return (
                <Pressable
                  key={applicant.applicationId}
                  onPress={() => setSelectedId(isSelected ? null : applicant.applicationId)}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      gap: 12,
                    }}
                    className={`rounded-lg border ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <View
                      className="bg-muted overflow-hidden rounded-full"
                      style={{ width: 40, height: 40 }}>
                      {avatarUri && (
                        <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40 }} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-foreground text-sm font-medium">
                        {applicant.firstName} {applicant.lastName}
                      </Text>
                      {applicant.totalRank != null && (
                        <Text variant="muted" className="text-xs">
                          {t('rankScore', { score: applicant.totalRank })}
                        </Text>
                      )}
                    </View>
                    <View
                      className={`h-5 w-5 rounded-full border-2 ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text variant="muted" className="text-sm">
            {t('noApplicants')}
          </Text>
        )}
      </ScrollView>

      <View
        style={{ padding: 16, paddingBottom: 32, gap: 8 }}
        className="border-border bg-background border-t">
        {selectedId && (
          <Button variant="destructive" onPress={() => handleClose(true)}>
            <Text>{t('closeWithChoice')}</Text>
          </Button>
        )}
        <Button variant="outline" onPress={() => handleClose(false)}>
          <Text>{t('closeWithoutChoice')}</Text>
        </Button>
      </View>
    </View>
  );
}
