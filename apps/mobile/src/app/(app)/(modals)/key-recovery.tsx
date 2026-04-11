import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';

export default function KeyRecoveryScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText variant="headline">{t('e2ee_title')}</ThemedText>
      <ThemedText variant="footnote" color={colors.tertiaryForeground} style={styles.description}>
        {t('e2ee_description')}
      </ThemedText>
      <ThemedButton onPress={() => router.back()}>{t('use_pin')}</ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  description: {
    textAlign: 'center',
  },
});
