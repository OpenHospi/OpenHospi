import { MAX_DECLINE_REASON_LENGTH } from '@openhospi/shared/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { NativeButton } from '@/components/native/button';
import { ThemedText } from '@/components/native/text';
import { ThemedTextarea } from '@/components/native/textarea';
import { useTheme } from '@/design';
import { clearPickerCallback, firePickerCallback } from '@/lib/picker-callbacks';

type Params = {
  callbackId: string;
};

export default function DeclineInvitationScreen() {
  const router = useRouter();
  const { callbackId } = useLocalSearchParams<Params>();
  const { bottom } = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.invitations' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    firePickerCallback<string>(callbackId, trimmed);
    clearPickerCallback(callbackId);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('declineReasonPlaceholder')}
        </ThemedText>
        <ThemedTextarea
          value={reason}
          onChangeText={setReason}
          placeholder={t('declineReasonPlaceholder')}
          maxLength={MAX_DECLINE_REASON_LENGTH}
          minHeight={120}
          accessibilityLabel={t('declineReasonLabel')}
        />
      </View>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: Math.max(bottom, spacing.lg),
            gap: spacing.sm,
            borderTopColor: colors.separator,
          },
        ]}>
        <NativeButton
          label={t('confirmDecline')}
          variant="destructive"
          onPress={handleConfirm}
          disabled={!reason.trim()}
        />
        <NativeButton label={tCommon('cancel')} variant="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
