import { useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeButton } from '@/components/native/button';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { API_BASE_URL } from '@/lib/constants';
import { hapticFormSubmitSuccess } from '@/lib/haptics';
import { useCalendarToken, useRegenerateCalendarToken } from '@/services/settings';

export default function SettingsCalendarModal() {
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors, spacing } = useTheme();

  const { data: tokenData, isPending } = useCalendarToken();
  const regenerateToken = useRegenerateCalendarToken();

  const handleSubscribe = () => {
    if (!tokenData?.token) return;
    const httpsUrl = `${API_BASE_URL}/api/calendar/${tokenData.token}`;
    const webcalUrl = httpsUrl.replace(/^https?:\/\//, 'webcal://');
    Linking.openURL(webcalUrl);
    router.back();
  };

  const handleRegenerate = () => {
    Alert.alert(t('calendar.regenerateButton'), t('calendar.regenerateConfirm'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('confirm'),
        onPress: () => {
          regenerateToken.mutate(undefined, {
            onSuccess: () => hapticFormSubmitSuccess(),
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { gap: spacing.xl, padding: spacing.lg }]}>
      <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
        {t('calendar.description')}
      </ThemedText>

      {isPending ? (
        <View style={{ gap: spacing.sm }}>
          <ThemedSkeleton width="100%" height={50} />
          <ThemedSkeleton width="100%" height={50} />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <NativeButton
            label={t('calendar.subscribeButton')}
            systemImage="calendar.badge.plus"
            materialIcon="event"
            onPress={handleSubscribe}
            disabled={!tokenData?.token}
            accessibilityHint={t('calendar.description')}
          />
          <NativeButton
            label={t('calendar.regenerateButton')}
            variant="outline"
            systemImage="arrow.clockwise"
            materialIcon="refresh"
            onPress={handleRegenerate}
            loading={regenerateToken.isPending}
          />
        </View>
      )}

      <ThemedText variant="caption1" color={colors.tertiaryForeground}>
        {t('calendar.warning')}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {},
});
