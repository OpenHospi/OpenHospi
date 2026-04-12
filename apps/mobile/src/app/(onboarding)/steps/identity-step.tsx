import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InputOTP } from '@/components/forms/input-otp';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { useSubmitIdentity, useVerifyEmail, useResendCode } from '@/services/onboarding';
import type { OnboardingStatus, ProfileWithPhotos } from '@openhospi/shared/api-types';

type Props = {
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
  status: OnboardingStatus | undefined;
};

export default function IdentityStep({ onNext, profile, status }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.identity' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  // If identity is already submitted and email verified, skip to next
  const alreadyComplete = !!status?.hasIdentity;

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(alreadyComplete);

  const submitIdentity = useSubmitIdentity();
  const verifyEmail = useVerifyEmail();
  const resendCode = useResendCode();

  function handleSubmitIdentity() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert(t('invalidData'));
      return;
    }
    submitIdentity.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() },
      {
        onSuccess: () => setShowCodeInput(true),
        onError: () => Alert.alert(t('invalidData')),
      }
    );
  }

  function handleCodeFilled(value: string) {
    verifyEmail.mutate(
      { email: email.trim(), code: value },
      {
        onSuccess: () => {
          setVerified(true);
          onNext();
        },
        onError: () => {
          Alert.alert(t('invalidCode'));
          setCode('');
        },
      }
    );
  }

  function handleResend() {
    resendCode.mutate({ email: email.trim() });
  }

  if (verified) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.verifiedContainer}>
          <ThemedText variant="headline" color={colors.primary}>
            {t('verified')}
          </ThemedText>
        </View>
        <ThemedButton onPress={onNext}>{tCommon('next')}</ThemedButton>
      </ScrollView>
    );
  }

  if (showCodeInput) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        <View>
          <ThemedText variant="headline">{t('enterCodeTitle')}</ThemedText>
          <ThemedText variant="footnote" color={colors.tertiaryForeground} style={styles.fieldHint}>
            {t('enterCodeDescription', { email })}
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText variant="subheadline" weight="500">
            {t('verificationCode')}
          </ThemedText>
          <InputOTP value={code} onChangeText={setCode} onFilled={handleCodeFilled} autoFocus />
          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('codeHint')}
          </ThemedText>
        </View>

        {verifyEmail.isPending && (
          <ThemedText variant="footnote" color={colors.tertiaryForeground} style={styles.centered}>
            {tCommon('loading')}
          </ThemedText>
        )}

        <ThemedButton variant="link" onPress={handleResend} disabled={resendCode.isPending}>
          {t('resendCode')}
        </ThemedButton>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('firstName')}
        </ThemedText>
        <ThemedInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('firstNamePlaceholder')}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('lastName')}
        </ThemedText>
        <ThemedInput
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('lastNamePlaceholder')}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('email')}
        </ThemedText>
        <ThemedInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ThemedText variant="caption1" color={colors.tertiaryForeground}>
          {t('emailHint')}
        </ThemedText>
      </View>

      <ThemedButton onPress={handleSubmitIdentity} disabled={submitIdentity.isPending}>
        {tCommon('next')}
      </ThemedButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  fieldHint: {
    marginTop: 4,
  },
  verifiedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  centered: {
    textAlign: 'center',
  },
});
