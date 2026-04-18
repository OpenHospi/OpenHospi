import { setupDevice } from '@openhospi/crypto';
import { PIN_LENGTH } from '@openhospi/shared/constants';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InputOTP } from '@/components/forms/input-otp';
import { NativeButton } from '@/components/native/button';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { api } from '@/lib/api-client';
import { getProtocolStore } from '@/lib/crypto/stores';
import { hapticFormSubmitError, hapticFormSubmitSuccess, hapticPinEntry } from '@/lib/haptics';
import { queryKeys } from '@/services/keys';

export default function SecurityStep() {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const queryClient = useQueryClient();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [loading, setLoading] = useState(false);

  function handlePinFilled(value: string) {
    hapticPinEntry();
    if (value.length === PIN_LENGTH) {
      setStep('confirm');
    }
  }

  async function handleConfirmFilled(value: string) {
    if (value !== pin) {
      hapticFormSubmitError();
      Alert.alert(t('pin_mismatch'));
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const store = getProtocolStore();
      const result = await setupDevice(store, value);

      await api.post<{ id: string }>('/api/mobile/chat/register-device', {
        registrationId: result.registrationId,
        identityKeyPublic: result.identityKeyPublic,
        signingKeyPublic: result.signingKeyPublic,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        signedPreKey: result.signedPreKey,
        oneTimePreKeys: result.oneTimePreKeys,
      });

      await api.post('/api/mobile/chat/backup', {
        encryptedData: result.encryptedBackup.ciphertext,
        iv: result.encryptedBackup.iv,
        salt: result.encryptedBackup.salt,
      });

      hapticFormSubmitSuccess();
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() });
    } catch (error) {
      console.error('[SecurityStep] Setup failed:', error);
      hapticFormSubmitError();
      Alert.alert(t('setup_error'));
      setConfirmPin('');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedSkeleton width="60%" height={24} />
        <ThemedSkeleton width="80%" height={16} />
        <ThemedSkeleton width={240} height={48} rounded="lg" />
        <ThemedText variant="footnote" color={colors.tertiaryForeground}>
          {t('generating_keys')}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}>
      <View>
        <ThemedText variant="headline">{t('e2ee_title')}</ThemedText>
        <ThemedText variant="footnote" color={colors.tertiaryForeground} style={styles.description}>
          {t('e2ee_description')}
        </ThemedText>
      </View>

      {step === 'enter' ? (
        <View style={styles.pinSection}>
          <ThemedText variant="subheadline" weight="500">
            {t('enter_pin')}
          </ThemedText>
          <InputOTP
            value={pin}
            onChangeText={setPin}
            onFilled={handlePinFilled}
            secureTextEntry
            autoFocus
          />
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('pin_hint')}
          </ThemedText>
          <NativeButton
            label={t('use_pin')}
            onPress={() => {
              if (pin.length !== PIN_LENGTH) {
                hapticFormSubmitError();
                Alert.alert(t('pin_length_error'));
                return;
              }
              setStep('confirm');
            }}
          />
        </View>
      ) : (
        <View style={styles.pinSection}>
          <ThemedText variant="subheadline" weight="500">
            {t('confirm_pin')}
          </ThemedText>
          <InputOTP
            value={confirmPin}
            onChangeText={setConfirmPin}
            onFilled={handleConfirmFilled}
            secureTextEntry
            autoFocus
          />
          <NativeButton
            label={t('change_pin')}
            variant="ghost"
            onPress={() => {
              setStep('enter');
              setPin('');
              setConfirmPin('');
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  description: {
    marginTop: 8,
  },
  pinSection: {
    gap: 16,
  },
});
