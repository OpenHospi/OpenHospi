import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '@openhospi/shared/constants';
import { StatusBar } from 'expo-status-bar';
import { GraduationCap, Loader2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { LanguagePicker } from '@/components/shared/language-picker';
import { Logo } from '@/components/shared/logo';
import { useTheme } from '@/design';
import { authClient } from '@/lib/auth-client';

export default function LoginScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' });
  const { colors } = useTheme();
  const [isPending, setIsPending] = useState(false);

  async function handleInAcademiaLogin() {
    setIsPending(true);
    try {
      await authClient.signIn.social({
        provider: 'generic-oidc',
        callbackURL: 'openhospi://',
      });
    } catch {
      Alert.alert(t('error'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleGitHubLogin() {
    setIsPending(true);
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: 'openhospi://',
      });
    } catch {
      Alert.alert(t('error'));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />

      <View style={styles.languageRow}>
        <LanguagePicker />
      </View>

      <View style={styles.center}>
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.content}>
          <View style={styles.logoRow}>
            <Logo size={40} />
            <ThemedText variant="title2" color={colors.primary}>
              {APP_NAME}
            </ThemedText>
          </View>

          <View style={styles.headerSection}>
            <ThemedText variant="largeTitle">{t('title')}</ThemedText>
            <ThemedText
              variant="subheadline"
              color={colors.tertiaryForeground}
              style={styles.descriptionText}>
              {t('description')}
            </ThemedText>
          </View>

          <View style={styles.buttonSection}>
            <ThemedButton size="lg" onPress={handleInAcademiaLogin} disabled={isPending}>
              {isPending ? (
                <Loader2 size={20} color={colors.primaryForeground} />
              ) : (
                <GraduationCap size={20} color={colors.primaryForeground} />
              )}
              <ThemedText variant="subheadline" weight="600" color={colors.primaryForeground}>
                {t('inacademiaButton')}
              </ThemedText>
            </ThemedButton>
            <ThemedText
              variant="caption1"
              color={colors.tertiaryForeground}
              style={styles.descriptionText}>
              {t('inacademiaDescription')}
            </ThemedText>
          </View>

          {__DEV__ && (
            <View style={styles.devSection}>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {t('devOrDivider')}
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
              </View>
              <ThemedButton
                variant="outline"
                size="lg"
                onPress={handleGitHubLogin}
                disabled={isPending}>
                {isPending ? (
                  <Loader2 size={20} color={colors.foreground} />
                ) : (
                  <Ionicons name="logo-github" size={20} color={colors.foreground} />
                )}
                <ThemedText variant="subheadline" weight="600">
                  {t('devGithubButton')}
                </ThemedText>
              </ThemedButton>
              <ThemedText
                variant="caption1"
                color={colors.tertiaryForeground}
                style={styles.descriptionText}>
                {t('devGithubDescription')}
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  languageRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 448,
    alignItems: 'center',
    gap: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSection: {
    alignItems: 'center',
    gap: 8,
  },
  descriptionText: {
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    gap: 12,
  },
  devSection: {
    width: '100%',
    gap: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
});
