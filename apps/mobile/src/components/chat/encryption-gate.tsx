import { PIN_LENGTH } from '@openhospi/shared/constants';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { hapticError, hapticSuccess } from '@/lib/haptics';
import { useTheme } from '@/design';

import { InputOTP } from '@/components/forms/input-otp';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
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
  const { colors } = useTheme();

  if (status === 'initializing') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ShieldCheck size={56} color={colors.primary} />
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {tSecurity('generating_keys')}
        </ThemedText>
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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ShieldCheck size={56} color={colors.primary} />
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {tSecurity('generating_keys')}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled">
      <View style={styles.headerSection}>
        <ShieldCheck size={56} color={colors.primary} />
        <ThemedText variant="headline">{tSecurity('e2ee_title')}</ThemedText>
        <ThemedText
          variant="subheadline"
          color={colors.tertiaryForeground}
          style={styles.textCenter}>
          {t('setup_required')}
        </ThemedText>
      </View>

      <View style={styles.pinSection}>
        <ThemedText variant="subheadline" weight="500" color={colors.tertiaryForeground}>
          {tSecurity('enter_pin')}
        </ThemedText>
        <InputOTP
          value={pin}
          onChangeText={setPin}
          onFilled={handleSetup}
          secureTextEntry
          autoFocus
        />
        {error && (
          <ThemedText variant="caption1" color={colors.destructive} style={styles.textCenter}>
            {error}
          </ThemedText>
        )}
        <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.textCenter}>
          {tSecurity('pin_hint')}
        </ThemedText>
      </View>

      <ThemedButton
        onPress={() => handleSetup(pin)}
        disabled={pin.length !== PIN_LENGTH}
        style={styles.setupButton}>
        {tSecurity('setup_pin')}
      </ThemedButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 32,
  },
  headerSection: {
    alignItems: 'center',
    gap: 12,
  },
  pinSection: {
    alignItems: 'center',
    gap: 16,
  },
  textCenter: {
    textAlign: 'center',
  },
  setupButton: {
    width: '100%',
    maxWidth: 280,
  },
});
