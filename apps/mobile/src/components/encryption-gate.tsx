import { PIN_LENGTH } from '@openhospi/shared/constants';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InputOTP } from '@/components/input-otp';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EncryptionContext, useEncryptionProvider } from '@/hooks/use-encryption';
import { useSession } from '@/lib/auth-client';

type Props = {
  children: React.ReactNode;
};

export function EncryptionGate({ children }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { t: tSecurity } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const encryption = useEncryptionProvider(userId);
  const { status, initializeDevice } = encryption;
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'initializing') {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (status === 'ready') {
    return <EncryptionContext.Provider value={encryption}>{children}</EncryptionContext.Provider>;
  }

  async function handleSetup(value: string) {
    if (value.length !== PIN_LENGTH) return;
    setLoading(true);

    try {
      await initializeDevice(value);
    } catch {
      Alert.alert(tSecurity('setup_error'));
      setPin('');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}
        className="bg-background">
        <ActivityIndicator size="large" />
        <Text variant="muted" className="text-sm">
          {tSecurity('generating_keys')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 24,
      }}
      keyboardShouldPersistTaps="handled"
      className="bg-background">
      <View style={{ alignItems: 'center', gap: 8 }}>
        <ShieldCheck size={40} className="text-primary" />
        <Text className="text-foreground text-lg font-semibold">{tSecurity('e2ee_title')}</Text>
        <Text variant="muted" className="text-sm" style={{ textAlign: 'center' }}>
          {t('setup_required')}
        </Text>
      </View>

      <View style={{ alignItems: 'center', gap: 16 }}>
        <Text variant="muted" className="text-sm font-medium">
          {tSecurity('enter_pin')}
        </Text>
        <InputOTP
          value={pin}
          onChangeText={setPin}
          onFilled={handleSetup}
          secureTextEntry
          autoFocus
        />
        <Text variant="muted" className="text-xs" style={{ textAlign: 'center' }}>
          {tSecurity('pin_hint')}
        </Text>
      </View>

      <Button
        onPress={() => handleSetup(pin)}
        disabled={pin.length !== PIN_LENGTH}
        style={{ width: '100%', maxWidth: 280 }}>
        <Text>{tSecurity('setup_pin')}</Text>
      </Button>
    </ScrollView>
  );
}
