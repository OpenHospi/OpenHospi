import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useSubmitIdentity, useVerifyEmail, useResendCode } from '@/services/onboarding';

type Props = { onNext: () => void };

export default function IdentityStep({ onNext }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.identity' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

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
      }
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
      }
    );
  }

  async function handleResend() {
    resendCode.mutate({ email: email.trim() });
  }

  if (verified) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
        <Text className="text-primary font-semibold">{t('verified')}</Text>
      </View>
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
          <Input
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
          />
          <Text variant="muted" className="text-xs">
            {t('codeHint')}
          </Text>
        </View>

        <Button onPress={handleVerifyCode} disabled={verifyEmail.isPending}>
          <Text>{t('verifyCode')}</Text>
        </Button>

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
