import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '@openhospi/shared/constants';
import { StatusBar } from 'expo-status-bar';
import { GraduationCap, Loader2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, useColorScheme, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { LanguagePicker } from '@/components/language-picker';
import { Logo } from '@/components/logo';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { THEME } from '@/lib/theme';

export default function LoginScreen() {
  const { t } = useTranslation('translation', {
    keyPrefix: 'auth.login',
  });
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
    <SafeAreaView className="bg-background flex-1">
      <StatusBar style="auto" />

      <View className="items-end px-4 pt-2">
        <LanguagePicker />
      </View>

      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="flex-1 items-center justify-center px-6">
        <View className="flex-row items-center gap-2">
          <Logo size={28} color={colors.primary} />
          <Text className="text-primary text-xl font-semibold tracking-tight">{APP_NAME}</Text>
        </View>

        <Card className="mt-6 w-full">
          <CardHeader className="items-center">
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>

          <CardContent className="gap-3">
            <Button
              className="rounded-xl py-3.5"
              onPress={handleInAcademiaLogin}
              disabled={isPending}>
              {isPending ? (
                <Loader2 size={20} color={colors.primaryForeground} />
              ) : (
                <GraduationCap size={20} color={colors.primaryForeground} />
              )}
              <Text>{t('inacademiaButton')}</Text>
            </Button>
            <Text variant="muted" className="text-center">
              {t('inacademiaDescription')}
            </Text>
          </CardContent>

          {__DEV__ && (
            <CardContent className="gap-3">
              <View className="flex-row items-center gap-3">
                <Separator className="flex-1" />
                <Text variant="muted" className="text-xs">
                  {t('devOrDivider')}
                </Text>
                <Separator className="flex-1" />
              </View>
              <Button
                variant="outline"
                className="rounded-xl py-3.5"
                onPress={handleGitHubLogin}
                disabled={isPending}>
                {isPending ? (
                  <Loader2 size={20} color={colors.foreground} />
                ) : (
                  <Ionicons name="logo-github" size={20} color={colors.foreground} />
                )}
                <Text>{t('devGithubButton')}</Text>
              </Button>
              <Text variant="muted" className="text-center">
                {t('devGithubDescription')}
              </Text>
            </CardContent>
          )}
        </Card>
      </Animated.View>
    </SafeAreaView>
  );
}
