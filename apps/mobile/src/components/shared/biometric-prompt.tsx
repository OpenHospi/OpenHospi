import { Fingerprint } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { authenticateWithBiometric } from '@/lib/biometric';
import { hapticError, hapticSuccess } from '@/lib/haptics';

type BiometricPromptProps = {
  onSuccess: () => void;
  onFallback: () => void;
};

export function BiometricPrompt({ onSuccess, onFallback }: BiometricPromptProps) {
  const { colors } = useTheme();

  async function handleAuthenticate() {
    const success = await authenticateWithBiometric();
    if (success) {
      hapticSuccess();
      onSuccess();
    } else {
      hapticError();
    }
  }

  const biometricLabel = Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <Fingerprint size={64} color={colors.primary} />

      <ThemedText variant="title3" style={styles.centered}>
        Unlock with {biometricLabel}
      </ThemedText>

      <ThemedButton onPress={handleAuthenticate} style={styles.fullWidth}>
        <ThemedText variant="subheadline" weight="500" color={colors.primaryForeground}>
          Unlock
        </ThemedText>
      </ThemedButton>

      <ThemedButton variant="ghost" onPress={onFallback}>
        <ThemedText variant="subheadline" color={colors.mutedForeground}>
          Use PIN instead
        </ThemedText>
      </ThemedButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 32,
    zIndex: 1000,
  },
  centered: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});
