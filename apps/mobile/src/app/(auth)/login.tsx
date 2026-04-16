import { Ionicons } from '@expo/vector-icons';
import {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { APP_NAME } from '@openhospi/shared/constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
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
import { mmkv } from '@/lib/mmkv';
import { isIOS } from '@/lib/platform';

if (!isIOS) {
  GoogleSignin.configure({
    webClientId: '116054357130-ou4gbhgss2pntbij1lm634ss1betorn5.apps.googleusercontent.com',
  });
}

export default function LoginScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' });
  const { colors, isDark } = useTheme();
  const [isPending, setIsPending] = useState(false);
  const [showReviewerLogin, setShowReviewerLogin] = useState(
    () => mmkv.getBoolean('reviewer-login-active') ?? false
  );

  // 3-step hidden gesture state (refs to avoid re-renders)
  const activationStep = useRef(0); // 0 = idle, 1 = first long-press done, 2 = taps done
  const descTapCount = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gestureTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function resetGesture() {
    activationStep.current = 0;
    descTapCount.current = 0;
    clearTimeout(tapTimerRef.current);
    clearTimeout(gestureTimerRef.current);
  }

  function handleLogoLongPress() {
    if (showReviewerLogin) return;

    if (activationStep.current === 0) {
      activationStep.current = 1;
      hapticLight();
      clearTimeout(gestureTimerRef.current);
      gestureTimerRef.current = setTimeout(resetGesture, 10_000);
    } else if (activationStep.current === 2) {
      clearTimeout(gestureTimerRef.current);
      resetGesture();
      hapticLight();
      mmkv.setBoolean('reviewer-login-active', true);
      setShowReviewerLogin(true);
    }
  }

  function handleDescriptionTap() {
    if (showReviewerLogin || activationStep.current !== 1) return;

    clearTimeout(tapTimerRef.current);
    descTapCount.current += 1;

    if (descTapCount.current >= 5) {
      activationStep.current = 2;
      descTapCount.current = 0;
      hapticLight();
      clearTimeout(gestureTimerRef.current);
      gestureTimerRef.current = setTimeout(resetGesture, 10_000);
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      descTapCount.current = 0;
    }, 3000);
  }

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

  async function handleAppleLogin() {
    setIsPending(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        Alert.alert(t('error'));
        return;
      }
      await authClient.signIn.social({
        provider: 'apple',
        idToken: {
          token: credential.identityToken,
        },
        callbackURL: '/',
      });
    } catch {
      Alert.alert(t('error'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleGoogleLogin() {
    setIsPending(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response) || !response.data.idToken) {
        Alert.alert(t('error'));
        return;
      }
      await authClient.signIn.social({
        provider: 'google',
        idToken: {
          token: response.data.idToken,
        },
        callbackURL: '/',
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.content}>
          <Pressable onLongPress={handleLogoLongPress} delayLongPress={3000} style={styles.logoRow}>
            <Logo size={40} />
            <ThemedText variant="title2" color={colors.primary}>
              {APP_NAME}
            </ThemedText>
          </Pressable>

          <View style={styles.headerSection}>
            <ThemedText variant="largeTitle">{t('title')}</ThemedText>
            <View
              onStartShouldSetResponder={() => {
                handleDescriptionTap();
                return false;
              }}>
              <ThemedText
                variant="subheadline"
                color={colors.tertiaryForeground}
                style={styles.centered}>
                {t('description')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.buttonSection}>
            <Pressable
              onPress={() => {
                hapticLight();
                void handleInAcademiaLogin();
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

          {showReviewerLogin && (
            <Animated.View
              entering={FadeInDown.duration(400).springify()}
              style={styles.reviewerSection}>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {t('reviewerDivider')}
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
              </View>

              {isIOS ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={
                    isDark
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={radius.lg}
                  onPress={() => {
                    hapticLight();
                    void handleAppleLogin();
                  }}
                  style={styles.nativeButton}
                />
              ) : (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Dark}
                  onPress={() => {
                    hapticLight();
                    void handleGoogleLogin();
                  }}
                  disabled={isPending}
                  style={styles.nativeButton}
                />
              )}

              <ThemedText
                variant="caption1"
                color={colors.tertiaryForeground}
                style={styles.centered}>
                {t('reviewerDescription')}
              </ThemedText>
            </Animated.View>
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
  reviewerSection: {
    width: '100%',
    gap: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  nativeButton: {
    width: '100%',
    height: 50,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
