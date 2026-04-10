import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedText } from '@/components/primitives/themed-text';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { useTheme } from '@/design';
import { useJoinHousePreview, useJoinHouse } from '@/services/house';

export default function JoinHouseScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.joinHouse' });
  const router = useRouter();
  const { colors } = useTheme();

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
      <>
        <Stack.Screen options={{ title: t('title') }} />
        <View style={styles.center}>
          <ThemedSkeleton width={80} height={80} circle />
          <ThemedSkeleton width="50%" height={20} />
          <ThemedSkeleton width="60%" height={28} />
        </View>
      </>
    );
  }

  if (isError || !data?.house) {
    return (
      <>
        <Stack.Screen options={{ title: t('title') }} />
        <NativeEmptyState
          sfSymbol="exclamationmark.triangle"
          icon={Home}
          title={t('notFound')}
          actionLabel={t('cancel')}
          onAction={() => router.back()}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('title') }} />

      <View style={styles.center}>
        <Home size={48} color={colors.primary} />

        <View style={styles.textGroup}>
          <ThemedText variant="title3">{t('joinPrompt')}</ThemedText>
          <ThemedText variant="title1">{data.house.name}</ThemedText>
        </View>

        {joinHouse.isError && (
          <ThemedText variant="footnote" color={colors.destructive} style={styles.errorText}>
            {joinHouse.error?.message ?? t('joinError')}
          </ThemedText>
        )}

        <View style={styles.buttonGroup}>
          <ThemedButton onPress={handleJoin} loading={joinHouse.isPending}>
            {t('joinButton')}
          </ThemedButton>
          <ThemedButton variant="outline" onPress={() => router.back()}>
            {t('cancel')}
          </ThemedButton>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  textGroup: {
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
});
