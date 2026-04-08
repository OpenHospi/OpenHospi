import { PIN_LENGTH } from '@openhospi/shared/constants';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { hapticError, hapticSuccess } from '@/lib/haptics';

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
  const [error, setError] = useState<string | null>(null);

  if (status === 'initializing') {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}
        className="bg-background">
        <ShieldCheck size={56} className="text-primary" />
        <Text variant="muted" className="text-sm">
          {tSecurity('generating_keys')}
        </Text>
      </View>
    );
  }

  if (status === 'ready') {
    return <EncryptionContext.Provider value={encryption}>{children}</EncryptionContext.Provider>;
  }

  async function handleSetup(value: string) {
    if (value.length !== PIN_LENGTH) return;
    setLoading(true);
    setError(null);

    try {
      await initializeDevice(value);
      hapticSuccess();
    } catch {
      hapticError();
      setError(tSecurity('setup_error'));
      setPin('');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}
        className="bg-background">
        <ShieldCheck size={56} className="text-primary" />
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
        gap: 32,
      }}
      keyboardShouldPersistTaps="handled"
      className="bg-background">
      <View style={{ alignItems: 'center', gap: 12 }}>
        <ShieldCheck size={56} className="text-primary" />
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
        {error && (
          <Text className="text-destructive text-xs" style={{ textAlign: 'center' }}>
            {error}
          </Text>
        )}
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
