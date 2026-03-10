import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InputOTP } from '@/components/input-otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useSubmitIdentity, useVerifyEmail, useResendCode } from '@/services/onboarding';
import type { OnboardingStatus, ProfileWithPhotos } from '@/services/types';

type Props = {
  onNext: () => void;
  profile: ProfileWithPhotos | undefined;
  status: OnboardingStatus | undefined;
};

export default function IdentityStep({ onNext, profile, status }: Props) {
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
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
          <Text className="text-primary font-semibold">{t('verified')}</Text>
        </View>
        <Button onPress={onNext}>
          <Text>{tCommon('next')}</Text>
        </Button>
      </ScrollView>
    );
  }

  if (showCodeInput) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16 }}>
        <View>
          <Text className="text-foreground font-semibold">{t('enterCodeTitle')}</Text>
          <Text variant="muted" style={{ marginTop: 4 }} className="text-sm">
            {t('enterCodeDescription', { email })}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Label>{t('verificationCode')}</Label>
          <InputOTP value={code} onChangeText={setCode} onFilled={handleCodeFilled} autoFocus />
          <Text variant="muted" className="text-xs">
            {t('codeHint')}
          </Text>
        </View>

        {verifyEmail.isPending && (
          <Text variant="muted" className="text-center text-sm">
            {tCommon('loading')}
          </Text>
        )}

        <Button variant="link" onPress={handleResend} disabled={resendCode.isPending}>
          <Text>{t('resendCode')}</Text>
        </Button>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Label>{t('firstName')}</Label>
        <Input
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('firstNamePlaceholder')}
          autoCapitalize="words"
        />
      </View>

      <View style={{ gap: 8 }}>
        <Label>{t('lastName')}</Label>
        <Input
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('lastNamePlaceholder')}
          autoCapitalize="words"
        />
      </View>

      <View style={{ gap: 8 }}>
        <Label>{t('email')}</Label>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text variant="muted" className="text-xs">
          {t('emailHint')}
        </Text>
      </View>

      <Button onPress={handleSubmitIdentity} disabled={submitIdentity.isPending}>
        <Text>{tCommon('next')}</Text>
      </Button>
    </ScrollView>
  );
}
