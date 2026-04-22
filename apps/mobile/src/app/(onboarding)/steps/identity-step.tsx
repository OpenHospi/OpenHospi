import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InputOTP } from '@/components/forms/input-otp';
import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/native/input';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { hapticFormSubmitError, hapticFormSubmitSuccess } from '@/lib/haptics';
import { useResendCode, useSubmitIdentity, useVerifyEmail } from '@/services/onboarding';
import type { OnboardingStatus, ProfileWithPhotos } from '@openhospi/shared/api-types';

type Props = {
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
  status: OnboardingStatus | undefined;
};

const identitySchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
});

type IdentityForm = z.infer<typeof identitySchema>;

export default function IdentityStep({ onNext, profile, status }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.identity' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const alreadyComplete = !!status?.hasIdentity;

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(alreadyComplete);
  const [formResetCounter, setFormResetCounter] = useState(0);

  const submitIdentity = useSubmitIdentity();
  const verifyEmail = useVerifyEmail();
  const resendCode = useResendCode();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      email: profile?.email ?? '',
    },
  });

  useEffect(() => {
    setFormResetCounter((n) => n + 1);
  }, [profile?.firstName, profile?.lastName, profile?.email]);

  function onSubmit(data: IdentityForm) {
    submitIdentity.mutate(data, {
      onSuccess: () => {
        setVerifiedEmail(data.email);
        setShowCodeInput(true);
      },
      onError: () => {
        hapticFormSubmitError();
        Alert.alert(t('invalidData'));
      },
    });
  }

  function handleCodeFilled(value: string) {
    verifyEmail.mutate(
      { email: verifiedEmail, code: value },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          setVerified(true);
          onNext();
        },
        onError: () => {
          hapticFormSubmitError();
          Alert.alert(t('invalidCode'));
          setCode('');
        },
      }
    );
  }

  function handleResend() {
    resendCode.mutate({ email: verifiedEmail });
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
        <NativeButton label={tCommon('next')} onPress={onNext} />
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
            {t('enterCodeDescription', { email: verifiedEmail })}
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

        <NativeButton
          label={t('resendCode')}
          variant="link"
          onPress={handleResend}
          disabled={resendCode.isPending}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
      key={formResetCounter}>
      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('firstName')}
        </ThemedText>
        <Controller
          control={control}
          name="firstName"
          render={({ field }) => (
            <ThemedInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('firstNamePlaceholder')}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              error={!!errors.firstName}
              accessibilityLabel={t('firstName')}
              accessibilityHint={t('firstNamePlaceholder')}
            />
          )}
        />
        {errors.firstName && (
          <ThemedText
            variant="caption1"
            color={colors.destructive}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {t('firstNamePlaceholder')}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('lastName')}
        </ThemedText>
        <Controller
          control={control}
          name="lastName"
          render={({ field }) => (
            <ThemedInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('lastNamePlaceholder')}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              error={!!errors.lastName}
              accessibilityLabel={t('lastName')}
              accessibilityHint={t('lastNamePlaceholder')}
            />
          )}
        />
        {errors.lastName && (
          <ThemedText
            variant="caption1"
            color={colors.destructive}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {t('lastNamePlaceholder')}
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText variant="subheadline" weight="500">
          {t('email')}
        </ThemedText>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <ThemedInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={!!errors.email}
              accessibilityLabel={t('email')}
              accessibilityHint={t('emailHint')}
            />
          )}
        />
        <ThemedText variant="caption1" color={colors.tertiaryForeground}>
          {t('emailHint')}
        </ThemedText>
        {errors.email && (
          <ThemedText
            variant="caption1"
            color={colors.destructive}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {t('invalidData')}
          </ThemedText>
        )}
      </View>

      <NativeButton
        label={tCommon('next')}
        onPress={handleSubmit(onSubmit)}
        disabled={submitIdentity.isPending}
        loading={submitIdentity.isPending}
      />
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
