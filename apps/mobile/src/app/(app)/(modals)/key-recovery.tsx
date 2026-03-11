import { PIN_LENGTH } from '@openhospi/shared/constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { InputOTP } from '@/components/input-otp';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/auth-client';
import { recoverKeysWithPIN, resetKeys, setupKeysWithPIN } from '@openhospi/crypto';

import { cryptoStore } from '@/lib/crypto/store';
import {
  deleteBackupApi,
  fetchBackupApi,
  uploadBackupApi,
  uploadIdentityKeyApi,
  uploadSignedPreKeyApi,
  uploadOneTimePreKeysApi,
} from '@/services/encryption';
import { queryKeys } from '@/services/keys';

export default function KeyRecoveryScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'loading' | 'recover' | 'setup'>('loading');
  const [backup, setBackup] = useState<{
    encryptedPrivateKey: string;
    backupIv: string;
    salt: string;
  } | null>(null);

  // Fetch backup on mount to determine mode
  useEffect(() => {
    fetchBackupApi().then((b) => {
      if (b) {
        setBackup(b);
        setMode('recover');
      } else {
        setMode('setup');
      }
    });
  }, []);

  const userId = session?.user?.id;

  async function handleRecoverFilled(value: string) {
    if (!userId || !backup) return;

    setLoading(true);
    try {
      await recoverKeysWithPIN(cryptoStore, userId, value, backup, {
        uploadIdentityKey: uploadIdentityKeyApi,
        uploadSignedPreKey: uploadSignedPreKeyApi,
        uploadOneTimePreKeys: uploadOneTimePreKeysApi,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.encryption.status() });
      Alert.alert(t('recovery_success'));
      router.back();
    } catch {
      Alert.alert(t('recovery_error'));
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartFresh() {
    if (!userId) return;

    Alert.alert(t('start_fresh'), t('start_fresh_warning'), [
      { text: t('change_pin'), style: 'cancel' },
      {
        text: t('start_fresh_confirm'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await resetKeys(cryptoStore, userId, { deleteBackup: deleteBackupApi });
            setMode('setup');
            setPin('');
            setConfirmPin('');
          } catch {
            Alert.alert(t('setup_error'));
          } finally {
            setLoading(false);
          }
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

    if (!userId) return;

    setLoading(true);
    try {
      await setupKeysWithPIN(cryptoStore, userId, value, {
        uploadIdentityKey: uploadIdentityKeyApi,
        uploadSignedPreKey: uploadSignedPreKeyApi,
        uploadOneTimePreKeys: uploadOneTimePreKeysApi,
        uploadBackup: uploadBackupApi,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.encryption.status() });
      Alert.alert(t('setup_success'));
      router.back();
    } catch {
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
