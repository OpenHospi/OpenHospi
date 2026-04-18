import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { useTheme } from '@/design';
import { hapticFormSubmitSuccess } from '@/lib/haptics';
import { useJoinHouse, useJoinHousePreview } from '@/services/house';

export default function JoinHouseScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.joinHouse' });
  const router = useRouter();
  const { colors, spacing } = useTheme();

  const { data, isPending, isError } = useJoinHousePreview(code);
  const joinHouse = useJoinHouse();

  async function handleJoin() {
    try {
      await joinHouse.mutateAsync(code);
      hapticFormSubmitSuccess();
      router.dismissAll();
      router.replace('/(app)/(tabs)/my-rooms');
    } catch {
      // Error handled by mutation state; rendered inline below.
    }
  }

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ title: t('title') }} />
        <View style={[styles.center, { padding: spacing['2xl'], gap: spacing['2xl'] }]}>
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
          androidIcon="warning"
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

      <View style={[styles.center, { padding: spacing['2xl'], gap: spacing['2xl'] }]}>
        <NativeIcon
          name="house.fill"
          androidName="home"
          size={48}
          color={colors.primary}
          accessibilityLabel={t('title')}
        />

        <View style={[styles.textGroup, { gap: spacing.xs }]}>
          <ThemedText variant="title3">{t('joinPrompt')}</ThemedText>
          <ThemedText variant="title1">{data.house.name}</ThemedText>
        </View>

        {joinHouse.isError ? (
          <ThemedText
            variant="footnote"
            color={colors.destructive}
            style={styles.errorText}
            accessibilityLiveRegion="polite">
            {joinHouse.error?.message ?? t('joinError')}
          </ThemedText>
        ) : null}

        <View style={[styles.buttonGroup, { gap: spacing.sm }]}>
          <NativeButton
            label={t('joinButton')}
            onPress={handleJoin}
            loading={joinHouse.isPending}
            accessibilityHint={t('joinPrompt')}
          />
          <NativeButton
            label={t('cancel')}
            variant="outline"
            onPress={() => router.back()}
            accessibilityHint={t('cancel')}
          />
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
  },
  textGroup: {
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
  },
});
