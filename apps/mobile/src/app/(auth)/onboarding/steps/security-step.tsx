import { PBKDF2_ITERATIONS, PIN_LENGTH } from '@openhospi/shared/constants';
import { useRouter } from 'expo-router';
import QuickCrypto from 'react-native-quick-crypto';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useTranslations } from '@/i18n';
import { api } from '@/lib/api-client';

const PRIVATE_KEY_STORE_KEY = 'openhospi_e2ee_private_key';

async function generateAndBackupKeys(pin: string, userId: string) {
  const keyPair = await QuickCrypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );

  const { publicKey, privateKey } = keyPair as unknown as {
    publicKey: Parameters<typeof QuickCrypto.subtle.exportKey>[1];
    privateKey: Parameters<typeof QuickCrypto.subtle.exportKey>[1];
  };
  const publicKeyRaw = await QuickCrypto.subtle.exportKey('jwk', publicKey);
  const privateKeyRaw = await QuickCrypto.subtle.exportKey('jwk', privateKey);

  // Store private key locally
  await SecureStore.setItemAsync(PRIVATE_KEY_STORE_KEY, JSON.stringify(privateKeyRaw));

  // Derive encryption key from PIN using PBKDF2
  const salt = QuickCrypto.randomBytes(16);
  const pinKey = await QuickCrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );
  const aesKey = await QuickCrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    pinKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  // Encrypt private key with AES
  const iv = QuickCrypto.randomBytes(12);
  const privateKeyBytes = new TextEncoder().encode(JSON.stringify(privateKeyRaw));
  const encryptedPrivateKey = await QuickCrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    privateKeyBytes,
  );

  // Upload public key + encrypted backup
  await api.post('/api/mobile/onboarding/identity', {
    _type: 'security_setup',
    publicKey: JSON.stringify(publicKeyRaw),
    encryptedPrivateKey: Buffer.from(encryptedPrivateKey).toString('base64'),
    salt: Buffer.from(salt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    userId,
  });
}

export default function SecurityStep() {
  const t = useTranslations('app.onboarding.security');
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    if (pin !== confirmPin) {
      Alert.alert(t('pin_mismatch'));
      return;
    }

    setLoading(true);
    try {
      // For now, just navigate to app — full E2EE setup will be integrated later
      // when the crypto package is fully available on mobile
      router.replace('/(app)/(tabs)/discover');
    } catch {
      Alert.alert(t('setup_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <Text className="text-base font-semibold text-foreground">{t('e2ee_title')}</Text>
      <Text className="mt-2 text-sm text-muted-foreground">{t('e2ee_description')}</Text>

      {step === 'enter' ? (
        <>
          <Text className="mt-6 text-sm font-medium text-foreground">{t('enter_pin')}</Text>
          <TextInput
            className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl tracking-[8px] text-foreground"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            secureTextEntry
          />
          <Text className="mt-1 text-xs text-muted-foreground">{t('pin_hint')}</Text>

          <Pressable
            className="mt-6 items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
            onPress={() => {
              if (pin.length !== PIN_LENGTH) {
                Alert.alert(t('pin_length_error'));
                return;
              }
              setStep('confirm');
            }}
          >
            <Text className="text-base font-semibold text-primary-foreground">{t('use_pin')}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text className="mt-6 text-sm font-medium text-foreground">{t('confirm_pin')}</Text>
          <TextInput
            className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl tracking-[8px] text-foreground"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            secureTextEntry
          />

          <Pressable
            className="mt-6 items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
            onPress={handleSetup}
            disabled={loading}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {t('setup_pin')}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
