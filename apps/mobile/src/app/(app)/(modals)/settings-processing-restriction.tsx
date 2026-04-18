import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { ThemedTextarea } from '@/components/native/textarea';
import { useTheme } from '@/design';
import { hapticFormSubmitSuccess } from '@/lib/haptics';
import {
  useActivateProcessingRestriction,
  useLiftProcessingRestriction,
  useProcessingRestriction,
} from '@/services/settings';

export default function SettingsProcessingRestrictionModal() {
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { colors, spacing } = useTheme();

  const [reason, setReason] = useState('');
  const { data: restriction, isPending } = useProcessingRestriction();
  const activateRestriction = useActivateProcessingRestriction();
  const liftRestriction = useLiftProcessingRestriction();

  const isRestricted = !!restriction;

  const handleActivate = () => {
    if (reason.length < 10) return;
    activateRestriction.mutate(
      { reason },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          Alert.alert(t('privacy.processingRestriction.activateSuccess'));
          router.back();
        },
      }
    );
  };

  const handleLift = () => {
    liftRestriction.mutate(undefined, {
      onSuccess: () => {
        hapticFormSubmitSuccess();
        Alert.alert(t('privacy.processingRestriction.liftSuccess'));
        router.back();
      },
    });
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { gap: spacing.xl, padding: spacing.lg }]}>
      <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
        {t('privacy.processingRestriction.description')}
      </ThemedText>

      {isPending ? (
        <View style={{ gap: spacing.sm }}>
          <ThemedSkeleton width="80%" height={14} />
          <ThemedSkeleton width="100%" height={80} rounded="md" />
        </View>
      ) : isRestricted ? (
        <View style={{ gap: spacing.md }}>
          <ThemedBadge variant="warning" label={t('privacy.processingRestriction.active')} />
          <NativeButton
            label={t('privacy.processingRestriction.liftButton')}
            variant="outline"
            systemImage="checkmark.circle"
            materialIcon="check-circle"
            onPress={handleLift}
            loading={liftRestriction.isPending}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <ThemedTextarea
            placeholder={t('privacy.processingRestriction.reasonPlaceholder')}
            value={reason}
            onChangeText={setReason}
            minHeight={100}
            accessibilityLabel={t('privacy.processingRestriction.reasonPlaceholder')}
          />
          <NativeButton
            label={t('privacy.processingRestriction.activateButton')}
            variant="destructive"
            systemImage="pause.circle"
            materialIcon="pause-circle-outline"
            onPress={handleActivate}
            loading={activateRestriction.isPending}
            disabled={reason.length < 10}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {},
});
