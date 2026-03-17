import { PIN_LENGTH } from '@openhospi/shared/constants';
import { setupDevice } from '@openhospi/crypto';
import { Platform, ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { InputOTP } from '@/components/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { getMobileSignalStore } from '@/lib/crypto/stores';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/services/keys';

export default function SecurityStep() {
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
      const store = getMobileSignalStore();
      const result = await setupDevice(store, value);

      // Register device on server
      const device = await api.post<{ id: string }>('/api/mobile/chat/register-device', {
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <ActivityIndicator size="large" />
        <Text variant="muted" className="text-sm">
          {t('generating_keys')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 24 }}>
      <View>
        <Text className="text-foreground font-semibold">{t('e2ee_title')}</Text>
        <Text variant="muted" style={{ marginTop: 8 }} className="text-sm">
          {t('e2ee_description')}
        </Text>
      </View>

      {step === 'enter' ? (
        <View style={{ gap: 16 }}>
          <Label>{t('enter_pin')}</Label>
          <InputOTP
            value={pin}
            onChangeText={setPin}
            onFilled={handlePinFilled}
            secureTextEntry
            autoFocus
          />
          <Text variant="muted" className="text-xs">
            {t('pin_hint')}
          </Text>
          <Button
            onPress={() => {
              if (pin.length !== PIN_LENGTH) {
                Alert.alert(t('pin_length_error'));
                return;
              }
              setStep('confirm');
            }}>
            <Text>{t('use_pin')}</Text>
          </Button>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Label>{t('confirm_pin')}</Label>
          <InputOTP
            value={confirmPin}
            onChangeText={setConfirmPin}
            onFilled={handleConfirmFilled}
            secureTextEntry
            autoFocus
          />
          <Button
            variant="ghost"
            onPress={() => {
              setStep('enter');
              setPin('');
              setConfirmPin('');
            }}>
            <Text>{t('change_pin')}</Text>
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
