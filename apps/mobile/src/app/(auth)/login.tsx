import { Ionicons } from '@expo/vector-icons';
import { APP_NAME } from '@openhospi/shared/constants';
import { StatusBar } from 'expo-status-bar';
import { GraduationCap, Loader2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { LanguagePicker } from '@/components/language-picker';
import { Logo } from '@/components/logo';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';

export default function LoginScreen() {
  const { t } = useTranslation('translation', {
    keyPrefix: 'auth.login',
  });
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
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <StatusBar style="auto" />

      <View className="items-end px-6 pt-4">
        <LanguagePicker />
      </View>

      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={{ width: '100%', maxWidth: 448, alignItems: 'center' }}>
          {/* Logo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <Logo size={40} />
            <Text className="text-primary text-2xl font-semibold tracking-tight">{APP_NAME}</Text>
          </View>

          {/* Card */}
          <View
            style={{ width: '100%' }}
            className="bg-card border-border rounded-xl border py-6 shadow-sm shadow-black/5">
            {/* Header */}
            <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 24, marginBottom: 24 }}>
              <Text className="text-foreground text-2xl font-semibold">{t('title')}</Text>
              <Text className="text-muted-foreground text-center text-sm">{t('description')}</Text>
            </View>

            {/* InAcademia button section */}
            <View style={{ gap: 16, paddingHorizontal: 24 }}>
              <Button
                size="lg"
                className="w-full rounded-xl"
                onPress={handleInAcademiaLogin}
                disabled={isPending}>
                {isPending ? (
                  <Loader2 size={20} className="text-primary-foreground" />
                ) : (
                  <GraduationCap size={20} className="text-primary-foreground" />
                )}
                <Text>{t('inacademiaButton')}</Text>
              </Button>
              <Text className="text-muted-foreground text-center text-xs">
                {t('inacademiaDescription')}
              </Text>
            </View>

            {/* GitHub button section (dev only) */}
            {__DEV__ && (
              <View style={{ gap: 16, paddingHorizontal: 24, marginTop: 24 }}>
                <View className="flex-row items-center gap-3">
                  <Separator className="flex-1" />
                  <Text className="text-muted-foreground text-xs">{t('devOrDivider')}</Text>
                  <Separator className="flex-1" />
                </View>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl"
                  onPress={handleGitHubLogin}
                  disabled={isPending}>
                  {isPending ? (
                    <Loader2 size={20} className="text-foreground" />
                  ) : (
                    <Ionicons name="logo-github" size={20} className="text-foreground" />
                  )}
                  <Text>{t('devGithubButton')}</Text>
                </Button>
                <Text className="text-muted-foreground text-center text-xs">
                  {t('devGithubDescription')}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
