import { PIN_LENGTH } from '@openhospi/shared/constants';
import { setupDevice } from '@openhospi/crypto';
import { Platform, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { InputOTP } from '@/components/forms/input-otp';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { getProtocolStore } from '@/lib/crypto/stores';
import { api } from '@/lib/api-client';
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
    if (value.length === PIN_LENGTH) {
      setStep('confirm');
    }
  }

  async function handleConfirmFilled(value: string) {
    if (value !== pin) {
      Alert.alert(t('pin_mismatch'));
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const store = getProtocolStore();
      const result = await setupDevice(store, value);

      // Register device on server
      await api.post<{ id: string }>('/api/mobile/chat/register-device', {
        registrationId: result.registrationId,
        identityKeyPublic: result.identityKeyPublic,
        signingKeyPublic: result.signingKeyPublic,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        signedPreKey: result.signedPreKey,
        oneTimePreKeys: result.oneTimePreKeys,
      });

      // Upload encrypted backup
      await api.post('/api/mobile/chat/backup', {
        encryptedData: result.encryptedBackup.ciphertext,
        iv: result.encryptedBackup.iv,
        salt: result.encryptedBackup.salt,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() });
    } catch (error) {
      console.error('[SecurityStep] Setup failed:', error);
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
          <ThemedButton
            onPress={() => {
              if (pin.length !== PIN_LENGTH) {
                Alert.alert(t('pin_length_error'));
                return;
              }
              setStep('confirm');
            }}>
            {t('use_pin')}
          </ThemedButton>
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
          <ThemedButton
            variant="ghost"
            onPress={() => {
              setStep('enter');
              setPin('');
              setConfirmPin('');
            }}>
            {t('change_pin')}
          </ThemedButton>
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
