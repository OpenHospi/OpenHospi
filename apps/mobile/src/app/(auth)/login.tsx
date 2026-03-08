import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '@openhospi/shared/constants';
import { StatusBar } from 'expo-status-bar';
import { GraduationCap, Loader2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguagePicker } from '@/components/language-picker';
import { Logo } from '@/components/logo';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { THEME } from '@/lib/theme';

export default function LoginScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' });
  const colorScheme = useColorScheme();
  const [isPending, setIsPending] = useState(false);

  const colors = colorScheme === 'dark' ? THEME.dark : THEME.light;

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
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="auto" />

      <View className="items-end px-4 pt-2">
        <LanguagePicker />
      </View>

      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="flex-1 items-center justify-center px-6"
      >
        <View className="flex-row items-center gap-2">
          <Logo size={28} color={colors.primary} />
          <Text className="text-xl font-semibold tracking-tight text-primary">{APP_NAME}</Text>
        </View>

        <View className="mt-6 w-full rounded-2xl border border-border bg-card p-6">
          <Text className="text-center text-2xl font-bold text-card-foreground">{t('title')}</Text>
          <Text className="mt-1.5 text-center text-sm text-muted-foreground">
            {t('description')}
          </Text>

          <View className="mt-6 gap-3">
            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-3.5 active:opacity-80"
              onPress={handleInAcademiaLogin}
              disabled={isPending}
              style={isPending ? { opacity: 0.6 } : undefined}
            >
              {isPending ? (
                <Loader2 size={20} color={colors.primaryForeground} />
              ) : (
                <GraduationCap size={20} color={colors.primaryForeground} />
              )}
              <Text className="text-base font-semibold text-primary-foreground">
                {t('inacademiaButton')}
              </Text>
            </Pressable>
            <Text className="text-center text-xs text-muted-foreground">
              {t('inacademiaDescription')}
            </Text>
          </View>

          {__DEV__ && (
            <View className="mt-5 gap-3">
              <View className="flex-row items-center gap-3">
                <View className="h-px flex-1 bg-border" />
                <Text className="text-xs text-muted-foreground">{t('devOrDivider')}</Text>
                <View className="h-px flex-1 bg-border" />
              </View>
              <Pressable
                className="flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 active:opacity-80"
                onPress={handleGitHubLogin}
                disabled={isPending}
                style={isPending ? { opacity: 0.6 } : undefined}
              >
                {isPending ? (
                  <Loader2 size={20} color={colors.foreground} />
                ) : (
                  <Ionicons name="logo-github" size={20} color={colors.foreground} />
                )}
                <Text className="text-base font-semibold text-card-foreground">
                  {t('devGithubButton')}
                </Text>
              </Pressable>
              <Text className="text-center text-xs text-muted-foreground">
                {t('devGithubDescription')}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
