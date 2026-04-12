import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '@openhospi/shared/constants';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/native/text';
import { Logo } from '@/components/shared/logo';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { authClient } from '@/lib/auth-client';
import { hapticLight } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';

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

  const primaryButtonStyle: ViewStyle = {
    height: isIOS ? 50 : 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: isIOS ? radius.lg : radius.md,
    backgroundColor: colors.primary,
    opacity: isPending ? 0.6 : 1,
  };

  const outlineButtonStyle: ViewStyle = {
    height: isIOS ? 50 : 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: isIOS ? radius.lg : radius.md,
    backgroundColor: colors.tertiaryBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    opacity: isPending ? 0.6 : 1,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
              style={styles.centered}>
              {t('description')}
            </ThemedText>
          </View>

          <View style={styles.buttonSection}>
            <Pressable
              onPress={() => {
                hapticLight();
                handleInAcademiaLogin();
              }}
              disabled={isPending}
              android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
              style={({ pressed }) => [primaryButtonStyle, pressed && isIOS && { opacity: 0.75 }]}>
              {isPending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : isIOS ? (
                <SymbolView
                  name="graduationcap.fill"
                  size={20}
                  tintColor={colors.primaryForeground}
                />
              ) : (
                <Ionicons name="school" size={20} color={colors.primaryForeground} />
              )}
              <ThemedText variant="body" weight="600" color={colors.primaryForeground}>
                {t('inacademiaButton')}
              </ThemedText>
            </Pressable>

            <ThemedText
              variant="caption1"
              color={colors.tertiaryForeground}
              style={styles.centered}>
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

              <Pressable
                onPress={() => {
                  hapticLight();
                  handleGitHubLogin();
                }}
                disabled={isPending}
                android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
                style={({ pressed }) => [
                  outlineButtonStyle,
                  pressed && isIOS && { opacity: 0.75 },
                ]}>
                {isPending ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <Ionicons name="logo-github" size={20} color={colors.foreground} />
                )}
                <ThemedText variant="body" weight="600">
                  {t('devGithubButton')}
                </ThemedText>
              </Pressable>

              <ThemedText
                variant="caption1"
                color={colors.tertiaryForeground}
                style={styles.centered}>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: Platform.select({ ios: 28, android: 24 }),
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
  centered: {
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    gap: 10,
  },
  devSection: {
    width: '100%',
    gap: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
