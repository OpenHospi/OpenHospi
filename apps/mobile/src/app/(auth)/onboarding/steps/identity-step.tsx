import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useTranslations } from '@/i18n';
import { useSubmitIdentity, useVerifyEmail, useResendCode } from '@/services/onboarding';

type Props = { onNext: () => void };

export default function IdentityStep({ onNext }: Props) {
  const t = useTranslations('app.onboarding.identity');
  const tCommon = useTranslations('common.labels');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);

  const submitIdentity = useSubmitIdentity();
  const verifyEmail = useVerifyEmail();
  const resendCode = useResendCode();

  async function handleSubmitIdentity() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert(t('invalidData'));
      return;
    }
    submitIdentity.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() },
      {
        onSuccess: () => setShowCodeInput(true),
        onError: () => Alert.alert(t('invalidData')),
      },
    );
  }

  async function handleVerifyCode() {
    verifyEmail.mutate(
      { email: email.trim(), code: code.trim() },
      {
        onSuccess: () => {
          setVerified(true);
          onNext();
        },
        onError: () => Alert.alert(t('invalidCode')),
      },
    );
  }

  async function handleResend() {
    resendCode.mutate({ email: email.trim() });
  }

  if (verified) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-base text-foreground">{t('verified')}</Text>
      </View>
    );
  }

  if (showCodeInput) {
    return (
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <Text className="text-base font-semibold text-foreground">{t('enterCodeTitle')}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {t('enterCodeDescription', { email })}
        </Text>

        <Text className="mt-4 text-sm font-medium text-foreground">{t('verificationCode')}</Text>
        <TextInput
          className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor="#999"
        />
        <Text className="mt-1 text-xs text-muted-foreground">{t('codeHint')}</Text>

        <Pressable
          className="mt-4 items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
          onPress={handleVerifyCode}
          disabled={verifyEmail.isPending}
        >
          <Text className="text-base font-semibold text-primary-foreground">{t('verifyCode')}</Text>
        </Pressable>

        <Pressable
          className="mt-3 items-center py-2"
          onPress={handleResend}
          disabled={resendCode.isPending}
        >
          <Text className="text-sm text-primary">{t('resendCode')}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <Text className="text-sm font-medium text-foreground">{t('firstName')}</Text>
      <TextInput
        className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        value={firstName}
        onChangeText={setFirstName}
        placeholder={t('firstNamePlaceholder')}
        placeholderTextColor="#999"
        autoCapitalize="words"
      />

      <Text className="mt-4 text-sm font-medium text-foreground">{t('lastName')}</Text>
      <TextInput
        className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        value={lastName}
        onChangeText={setLastName}
        placeholder={t('lastNamePlaceholder')}
        placeholderTextColor="#999"
        autoCapitalize="words"
      />

      <Text className="mt-4 text-sm font-medium text-foreground">{t('email')}</Text>
      <TextInput
        className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        value={email}
        onChangeText={setEmail}
        placeholder={t('emailPlaceholder')}
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text className="mt-1 text-xs text-muted-foreground">{t('emailHint')}</Text>

      <Pressable
        className="mt-6 items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
        onPress={handleSubmitIdentity}
        disabled={submitIdentity.isPending}
      >
        <Text className="text-base font-semibold text-primary-foreground">{tCommon('next')}</Text>
      </Pressable>
    </ScrollView>
  );
}
