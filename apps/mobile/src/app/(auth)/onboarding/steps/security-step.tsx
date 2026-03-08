import { PIN_LENGTH } from '@openhospi/shared/constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';

export default function SecurityStep() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
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
      router.replace('/(app)/(tabs)/discover');
    } catch {
      Alert.alert(t('setup_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <Text className="font-semibold">{t('e2ee_title')}</Text>
      <Text variant="muted" className="mt-2">
        {t('e2ee_description')}
      </Text>

      {step === 'enter' ? (
        <>
          <View className="mt-6 gap-1.5">
            <Label>{t('enter_pin')}</Label>
            <Input
              className="text-center text-2xl tracking-[8px]"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
              secureTextEntry
            />
            <Text variant="muted" className="text-xs">
              {t('pin_hint')}
            </Text>
          </View>

          <Button
            className="mt-6"
            onPress={() => {
              if (pin.length !== PIN_LENGTH) {
                Alert.alert(t('pin_length_error'));
                return;
              }
              setStep('confirm');
            }}
          >
            <Text>{t('use_pin')}</Text>
          </Button>
        </>
      ) : (
        <>
          <View className="mt-6 gap-1.5">
            <Label>{t('confirm_pin')}</Label>
            <Input
              className="text-center text-2xl tracking-[8px]"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
              secureTextEntry
            />
          </View>

          <Button className="mt-6" onPress={handleSetup} disabled={loading}>
            <Text>{t('setup_pin')}</Text>
          </Button>
        </>
      )}
    </ScrollView>
  );
}
