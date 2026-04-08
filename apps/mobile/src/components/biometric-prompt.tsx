import { Fingerprint } from 'lucide-react-native';
import { Platform } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authenticateWithBiometric } from '@/lib/biometric';
import { hapticError, hapticSuccess } from '@/lib/haptics';

type BiometricPromptProps = {
  onSuccess: () => void;
  onFallback: () => void;
};

export function BiometricPrompt({ onSuccess, onFallback }: BiometricPromptProps) {
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
      style={{
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
      }}
      className="bg-background">
      <Fingerprint size={64} className="text-primary" />

      <Text className="text-foreground text-center text-xl font-semibold">
        Unlock with {biometricLabel}
      </Text>

      <Button onPress={handleAuthenticate} style={{ width: '100%' }}>
        <Text className="text-primary-foreground font-medium">Unlock</Text>
      </Button>

      <Button variant="ghost" onPress={onFallback}>
        <Text className="text-muted-foreground text-sm">Use PIN instead</Text>
      </Button>
    </Animated.View>
  );
}
