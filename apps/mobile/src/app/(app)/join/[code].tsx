import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ErrorState } from '@/components/error-state';
import { useJoinHousePreview, useJoinHouse } from '@/services/house';

export default function JoinHouseScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.joinHouse' });
  const router = useRouter();

  const { data, isPending, isError, refetch } = useJoinHousePreview(code);
  const joinHouse = useJoinHouse();

  async function handleJoin() {
    try {
      await joinHouse.mutateAsync(code);
      router.dismissAll();
      router.replace('/(app)/(tabs)/my-rooms');
    } catch {
      // Error handled by mutation state
    }
  }

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <Stack.Screen options={{ title: t('title') }} />
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError || !data?.house) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background">
        <Stack.Screen options={{ title: t('title') }} />
        <ErrorState onRetry={refetch} message={t('notFound')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <Stack.Screen options={{ title: t('title') }} />

      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="bg-primary/10">
          <Home size={40} className="text-primary" />
        </View>

        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text className="text-foreground text-xl font-bold">{t('joinPrompt')}</Text>
          <Text className="text-foreground text-2xl font-bold">{data.house.name}</Text>
        </View>

        {joinHouse.isError && (
          <Text className="text-destructive text-center text-sm">
            {joinHouse.error?.message ?? t('joinError')}
          </Text>
        )}

        <View style={{ width: '100%', gap: 12 }}>
          <Button onPress={handleJoin} disabled={joinHouse.isPending}>
            {joinHouse.isPending ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text>{t('joinButton')}</Text>
            )}
          </Button>
          <Button variant="outline" onPress={() => router.back()}>
            <Text>{t('cancel')}</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
