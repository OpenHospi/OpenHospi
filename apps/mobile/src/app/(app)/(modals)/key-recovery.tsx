import { PIN_LENGTH } from '@openhospi/shared/constants';
import type { EncryptedBackup } from '@openhospi/crypto';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { InputOTP } from '@/components/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { setupKeysWithPIN, recoverKeysWithPIN } from '@/lib/encryption/KeySetup';
import { registerDeviceApi } from '@/services/devices';
import {
  fetchBackupApi,
  uploadBackupApi,
  uploadSignedPreKeyApi,
  uploadOneTimePreKeysApi,
} from '@/services/encryption';
import { queryKeys } from '@/services/keys';

export default function KeyRecoveryScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const router = useRouter();
  const queryClient = useQueryClient();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'loading' | 'recover' | 'setup'>('loading');
  const [backup, setBackup] = useState<EncryptedBackup | null>(null);

  // Fetch backup on mount to determine mode
  useEffect(() => {
    fetchBackupApi()
      .then((b) => {
        if (b) {
          setBackup({
            version: 1,
            ciphertext: b.encryptedPrivateKey,
            iv: b.backupIv,
            salt: b.salt,
          });
          setMode('recover');
        } else {
          setMode('setup');
        }
      })
      .catch((error) => {
        console.error('[KeyRecovery] Failed to fetch backup:', error);
        setMode('setup');
      });
  }, []);

  async function handleRecoverFilled(value: string) {
    if (!backup) return;

    setLoading(true);
    try {
      const result = await recoverKeysWithPIN(backup, value);

      // Register device on server — returns device UUID
      const device = await registerDeviceApi({
        deviceId: 1,
        registrationId: result.registrationId,
        identityKeyPublic: result.identityKeyPublic,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });

      // Upload prekeys using device UUID
      await uploadSignedPreKeyApi(device.id, result.signedPreKey);
      await uploadOneTimePreKeysApi(device.id, result.oneTimePreKeys);

      await queryClient.invalidateQueries({ queryKey: queryKeys.encryption.status() });
      Alert.alert(t('recovery_success'));
      router.back();
    } catch (error) {
      console.error('[KeyRecovery] Recovery failed:', error);
      Alert.alert(t('recovery_error'));
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartFresh() {
    Alert.alert(t('start_fresh'), t('start_fresh_warning'), [
      { text: t('change_pin'), style: 'cancel' },
      {
        text: t('start_fresh_confirm'),
        style: 'destructive',
        onPress: () => {
          setMode('setup');
          setPin('');
          setConfirmPin('');
        },
      },
    ]);
  }

  function handleNewPinFilled(value: string) {
    if (value.length === PIN_LENGTH) {
      setMode('setup');
    }
  }

  async function handleConfirmNewPinFilled(value: string) {
    if (value !== pin) {
      Alert.alert(t('pin_mismatch'));
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const result = await setupKeysWithPIN(value);

      // Register device on server — returns device UUID
      const device = await registerDeviceApi({
        deviceId: 1,
        registrationId: result.registrationId,
        identityKeyPublic: result.identityKeyPublic,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });

      // Upload prekeys using device UUID
      await uploadSignedPreKeyApi(device.id, result.signedPreKey);
      await uploadOneTimePreKeysApi(device.id, result.oneTimePreKeys);
      await uploadBackupApi({
        encryptedPrivateKey: result.encryptedBackup.ciphertext,
        backupIv: result.encryptedBackup.iv,
        salt: result.encryptedBackup.salt,
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.encryption.status() });
      Alert.alert(t('setup_success'));
      router.back();
    } catch (error) {
      console.error('[KeyRecovery] Setup failed:', error);
      Alert.alert(t('setup_error'));
      setConfirmPin('');
    } finally {
      setLoading(false);
    }
  }

  if (loading || mode === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <ActivityIndicator size="large" />
        <Text variant="muted" className="text-sm">
          {t('generating_keys')}
        </Text>
      </View>
    );
  }

  if (mode === 'recover') {
    return (
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, gap: 24 }}>
        <View>
          <Text className="text-foreground font-semibold">{t('recovery_title')}</Text>
          <Text variant="muted" style={{ marginTop: 8 }} className="text-sm">
            {t('recovery_description')}
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Label>{t('enter_pin')}</Label>
          <InputOTP
            value={pin}
            onChangeText={setPin}
            onFilled={handleRecoverFilled}
            secureTextEntry
            autoFocus
          />
        </View>

        <Button variant="ghost" onPress={handleStartFresh}>
          <Text>{t('start_fresh')}</Text>
        </Button>
      </ScrollView>
    );
  }

  // Setup mode (no backup or after start fresh)
  const isConfirming = pin.length === PIN_LENGTH;

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24, gap: 24 }}>
      <View>
        <Text className="text-foreground font-semibold">{t('e2ee_title')}</Text>
        <Text variant="muted" style={{ marginTop: 8 }} className="text-sm">
          {t('no_backup')}
        </Text>
      </View>

      {!isConfirming ? (
        <View style={{ gap: 16 }}>
          <Label>{t('enter_pin')}</Label>
          <InputOTP
            value={pin}
            onChangeText={setPin}
            onFilled={handleNewPinFilled}
            secureTextEntry
            autoFocus
          />
          <Text variant="muted" className="text-xs">
            {t('pin_hint')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Label>{t('confirm_pin')}</Label>
          <InputOTP
            value={confirmPin}
            onChangeText={setConfirmPin}
            onFilled={handleConfirmNewPinFilled}
            secureTextEntry
            autoFocus
          />
          <Button
            variant="ghost"
            onPress={() => {
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
