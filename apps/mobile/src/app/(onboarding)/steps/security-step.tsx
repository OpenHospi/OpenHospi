import { PIN_LENGTH } from '@openhospi/shared/constants';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { InputOTP } from '@/components/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/auth-client';
import { setupKeysWithPIN } from '@/lib/crypto/key-management';
import {
  uploadIdentityKeyApi,
  uploadSignedPreKeyApi,
  uploadOneTimePreKeysApi,
  uploadBackupApi,
} from '@/services/encryption';
import { queryKeys } from '@/services/keys';

export default function SecurityStep() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const { data: session } = useSession();
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

    if (!session?.user?.id) {
      Alert.alert(t('setup_error'));
      return;
    }

    setLoading(true);
    try {
      await setupKeysWithPIN(session.user.id, value, {
        uploadIdentityKey: uploadIdentityKeyApi,
        uploadSignedPreKey: uploadSignedPreKeyApi,
        uploadOneTimePreKeys: uploadOneTimePreKeysApi,
        uploadBackup: uploadBackupApi,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() });
    } catch {
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
