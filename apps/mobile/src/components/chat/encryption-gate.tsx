import { PIN_LENGTH } from '@openhospi/shared/constants';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InputOTP } from '@/components/forms/input-otp';
import { PlatformSurface } from '@/components/layout/platform-surface';
import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { EncryptionContext, useEncryptionProvider } from '@/hooks/use-encryption';
import { useSession } from '@/lib/auth-client';
import { hapticError, hapticSuccess } from '@/lib/haptics';

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

  if (status === 'initializing' || loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.background }]}
        accessibilityRole="progressbar"
        accessibilityLabel={tSecurity('generating_keys')}>
        <View
          style={[styles.iconBadge, { backgroundColor: colors.primary + '1A' }]}
          accessibilityElementsHidden>
          <NativeIcon
            name="checkmark.shield.fill"
            androidName="verified-user"
            size={40}
            color={colors.primary}
          />
        </View>
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

  return (
    <ScrollView
      style={[styles.flex1, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      accessibilityRole="none">
      <PlatformSurface variant="card" style={styles.heroCard}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primary + '1A' }]}>
          <NativeIcon
            name="checkmark.shield.fill"
            androidName="verified-user"
            size={44}
            color={colors.primary}
          />
        </View>
        <ThemedText variant="title3" weight="700" style={styles.textCenter}>
          {tSecurity('e2ee_title')}
        </ThemedText>
        <ThemedText
          variant="subheadline"
          color={colors.secondaryForeground}
          style={styles.textCenter}>
          {t('setup_required')}
        </ThemedText>
      </PlatformSurface>

      <View style={styles.pinSection}>
        <ThemedText variant="subheadline" weight="600" color={colors.secondaryForeground}>
          {tSecurity('enter_pin')}
        </ThemedText>
        <InputOTP
          value={pin}
          onChangeText={setPin}
          onFilled={handleSetup}
          secureTextEntry
          autoFocus
        />
        {error ? (
          <ThemedText variant="caption1" color={colors.destructive} style={styles.textCenter}>
            {error}
          </ThemedText>
        ) : null}
        <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.textCenter}>
          {tSecurity('pin_hint')}
        </ThemedText>
      </View>

      <NativeButton
        label={tSecurity('setup_pin')}
        onPress={() => handleSetup(pin)}
        disabled={pin.length !== PIN_LENGTH}
        style={styles.setupButton}
        accessibilityLabel={tSecurity('setup_pin')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 32,
  },
  heroCard: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
    width: '100%',
    maxWidth: 360,
  },
  textCenter: {
    textAlign: 'center',
  },
  pinSection: {
    alignItems: 'center',
    gap: 16,
  },
  setupButton: {
    width: '100%',
    maxWidth: 280,
  },
});
