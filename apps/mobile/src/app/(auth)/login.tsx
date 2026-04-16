import { Ionicons } from '@expo/vector-icons';
import {
  GoogleSignin,
  GoogleSigninButton,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { APP_NAME, GOOGLE_WEB_CLIENT_ID } from '@openhospi/shared/constants';
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

const REVIEWER_STORAGE_KEY = 'reviewer-login-active';
const GESTURE_TIMEOUT = 10_000;
const TAP_RESET_TIMEOUT = 3_000;
const REQUIRED_TAPS = 5;

if (!isIOS) {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
}

// ── Login handlers ──

async function signInWithInAcademia() {
  await authClient.signIn.social({
    provider: 'generic-oidc',
    callbackURL: 'openhospi://',
  });
}

async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('No identity token');
  await authClient.signIn.social({
    provider: 'apple',
    idToken: { token: credential.identityToken },
    callbackURL: '/',
  });
}

async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response) || !response.data.idToken) {
    throw new Error('No ID token');
  }
  await authClient.signIn.social({
    provider: 'google',
    idToken: { token: response.data.idToken },
    callbackURL: '/',
  });
}

// ── Component ──

export default function LoginScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' });
  const { colors, isDark } = useTheme();
  const [isPending, setIsPending] = useState(false);
  const [showReviewerLogin, setShowReviewerLogin] = useState(
    () => mmkv.getBoolean(REVIEWER_STORAGE_KEY) ?? false
  );

  // ── 3-step hidden gesture ──
  const step = useRef(0);
  const taps = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gestureTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function resetGesture() {
    step.current = 0;
    taps.current = 0;
    clearTimeout(tapTimer.current);
    clearTimeout(gestureTimer.current);
  }

  function handleLogoLongPress() {
    if (showReviewerLogin) return;

    if (step.current === 0) {
      step.current = 1;
      hapticLight();
      clearTimeout(gestureTimer.current);
      gestureTimer.current = setTimeout(resetGesture, GESTURE_TIMEOUT);
    } else if (step.current === 2) {
      resetGesture();
      hapticLight();
      mmkv.setBoolean(REVIEWER_STORAGE_KEY, true);
      setShowReviewerLogin(true);
    }
  }

  function handleDescriptionTap() {
    if (showReviewerLogin || step.current !== 1) return;

    clearTimeout(tapTimer.current);
    taps.current += 1;

    if (taps.current >= REQUIRED_TAPS) {
      step.current = 2;
      taps.current = 0;
      hapticLight();
      clearTimeout(gestureTimer.current);
      gestureTimer.current = setTimeout(resetGesture, GESTURE_TIMEOUT);
      return;
    }

    tapTimer.current = setTimeout(() => {
      taps.current = 0;
    }, TAP_RESET_TIMEOUT);
  }

  // ── Shared login wrapper ──
  async function handleLogin(provider: () => Promise<void>) {
    setIsPending(true);
    try {
      await provider();
    } catch {
      Alert.alert(t('error'));
    } finally {
      setIsPending(false);
    }
  }

  // ── Styles ──
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
          {/* Logo — step 1 & 3 of hidden gesture (long press) */}
          <Pressable onLongPress={handleLogoLongPress} delayLongPress={3000} style={styles.logoRow}>
            <Logo size={40} />
            <ThemedText variant="title2" color={colors.primary}>
              {APP_NAME}
            </ThemedText>
          </Pressable>

          <View style={styles.headerSection}>
            <ThemedText variant="largeTitle">{t('title')}</ThemedText>
            {/* Description — step 2 of hidden gesture (5 taps) */}
            <View onStartShouldSetResponder={() => (handleDescriptionTap(), false)}>
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
                void handleLogin(signInWithInAcademia);
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
                    void handleLogin(signInWithApple);
                  }}
                  style={styles.nativeButton}
                />
              ) : (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Dark}
                  onPress={() => {
                    hapticLight();
                    void handleLogin(signInWithGoogle);
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
  container: { flex: 1 },
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
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerSection: { alignItems: 'center', gap: 8 },
  centered: { textAlign: 'center' },
  buttonSection: { width: '100%', gap: 10 },
  reviewerSection: { width: '100%', gap: 10 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  nativeButton: { width: '100%', height: 50 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
});
