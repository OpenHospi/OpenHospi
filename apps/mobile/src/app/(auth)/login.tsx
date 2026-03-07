import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguagePicker } from '@/components/language-picker';
import { useTranslations } from '@/i18n';
import { authClient } from '@/lib/auth-client';

export default function LoginScreen() {
  const t = useTranslations('auth.login');

  async function handleInAcademiaLogin() {
    try {
      await authClient.signIn.social({
        provider: 'generic-oidc',
        callbackURL: 'openhospi://',
      });
    } catch {
      Alert.alert(t('error'));
    }
  }

  async function handleGitHubLogin() {
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: 'openhospi://',
      });
    } catch {
      Alert.alert(t('error'));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="auto" />

      <View className="items-end px-4 pt-2">
        <LanguagePicker />
      </View>

      <Animated.View
        entering={FadeIn.duration(600)}
        className="flex-1 items-center justify-center px-8"
      >
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 128, height: 128, marginBottom: 32 }}
          contentFit="contain"
        />

        <Text className="text-3xl font-bold text-foreground">{t('title')}</Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">{t('description')}</Text>

        <View className="mt-12 w-full gap-4">
          <Pressable
            className="w-full items-center rounded-xl bg-primary px-6 py-4 active:opacity-80"
            onPress={handleInAcademiaLogin}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {t('inacademiaButton')}
            </Text>
          </Pressable>
          <Text className="text-center text-sm text-muted-foreground">
            {t('inacademiaDescription')}
          </Text>
        </View>

        {__DEV__ && (
          <View className="mt-8 w-full gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text className="text-sm text-muted-foreground">{t('devOrDivider')}</Text>
              <View className="h-px flex-1 bg-border" />
            </View>
            <Pressable
              className="w-full items-center rounded-xl border border-border bg-secondary px-6 py-4 active:opacity-80"
              onPress={handleGitHubLogin}
            >
              <Text className="text-base font-semibold text-secondary-foreground">
                {t('devGithubButton')}
              </Text>
            </Pressable>
            <Text className="text-center text-sm text-muted-foreground">
              {t('devGithubDescription')}
            </Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
