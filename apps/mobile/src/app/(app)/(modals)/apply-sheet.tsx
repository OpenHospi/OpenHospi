import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from '@openhospi/shared/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/native/text';
import { ThemedTextarea } from '@/components/primitives/themed-textarea';
import { useTheme } from '@/design';
import { hapticFormSubmitError, hapticFormSubmitSuccess } from '@/lib/haptics';
import { useApplyToRoom } from '@/services/rooms';

export default function ApplySheetScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.roomDetail' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [message, setMessage] = useState('');
  const applyToRoom = useApplyToRoom();

  function handleSubmit() {
    if (message.trim().length < MIN_PERSONAL_MESSAGE_LENGTH) return;

    applyToRoom.mutate(
      { roomId, data: { personalMessage: message.trim() } },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          Alert.alert(t('applySuccess'));
          router.back();
        },
        onError: (err) => {
          hapticFormSubmitError();
          Alert.alert(err.message);
        },
      }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('personalMessage')}
          </ThemedText>
          <ThemedTextarea
            value={message}
            onChangeText={setMessage}
            placeholder={t('personalMessagePlaceholder')}
            maxLength={MAX_PERSONAL_MESSAGE_LENGTH}
            numberOfLines={8}
            minHeight={160}
          />
          <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.counter}>
            {message.length}/{MAX_PERSONAL_MESSAGE_LENGTH} (min {MIN_PERSONAL_MESSAGE_LENGTH})
          </ThemedText>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <ThemedButton
          onPress={handleSubmit}
          disabled={applyToRoom.isPending || message.trim().length < MIN_PERSONAL_MESSAGE_LENGTH}>
          {tCommon('submit')}
        </ThemedButton>
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
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  counter: {
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
