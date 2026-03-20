import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dot, Euro, FileText, Home } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useApplications } from '@/services/applications';
import { getStoragePublicUrl } from '@/lib/storage-url';
import type { UserApplication } from '@/services/types';

function ApplicationCard({ item, onPress }: { item: UserApplication; onPress: () => void }) {
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });

  const coverUrl = item.roomCoverPhotoUrl
    ? getStoragePublicUrl(item.roomCoverPhotoUrl, 'room-photos')
    : null;

  return (
    <Pressable onPress={onPress}>
      <Card
        style={{
          flexDirection: 'row',
          gap: 12,
          padding: 12,
          paddingVertical: 12,
        }}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              height: 80,
              width: 80,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
            className="bg-muted">
            <Home size={24} className="text-muted-foreground" />
          </View>
        )}
        <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
          <Text className="text-card-foreground font-semibold" numberOfLines={1}>
            {item.roomTitle}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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

function EmptyState({ message }: { message: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}>
      <View
        style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}
        className="rounded-lg border border-dashed">
        <FileText size={32} className="text-muted-foreground" />
        <Text variant="muted" style={{ marginTop: 16 }} className="text-center">
          {message}
        </Text>
      </View>
    </View>
  );
}

export default function ApplicationsScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const router = useRouter();

  const { data: applications, isPending, refetch, isRefetching } = useApplications();

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background"
        edges={['top']}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <Text className="text-foreground text-2xl font-bold tracking-tight">{t('title')}</Text>
      </View>

      <FlatList
        data={applications ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: UserApplication }) => (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <ApplicationCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/(app)/application/[id]',
                  params: { id: item.id },
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={<EmptyState message={t('empty')} />}
        contentContainerStyle={!applications?.length ? { flex: 1 } : { paddingBottom: 16 }}
        refreshing={isRefetching}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}
