import { ONBOARDING_TOTAL_STEPS } from '@openhospi/shared/constants';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { useOnboardingStatus } from '@/services/onboarding';
import { useProfile } from '@/services/profile';

import AboutStep from './steps/about-step';
import BioStep from './steps/bio-step';
import IdentityStep from './steps/identity-step';
import LanguagesStep from './steps/languages-step';
import PersonalityStep from './steps/personality-step';
import PhotosStep from './steps/photos-step';
import SecurityStep from './steps/security-step';

const STEP_KEYS = [
  'identity',
  'about',
  'bio',
  'personality',
  'languages',
  'photos',
  'security',
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { data: status, isPending: statusPending } = useOnboardingStatus();
  const { data: profile, isPending: profilePending } = useProfile();
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const step = currentStep ?? status?.currentStep ?? 1;
  const clampedStep = Math.min(step, ONBOARDING_TOTAL_STEPS);

  if (statusPending || profilePending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  function handleNext() {
    if (clampedStep < ONBOARDING_TOTAL_STEPS) {
      setCurrentStep(clampedStep + 1);
    }
  }

  function handleBack() {
    if (clampedStep > 1) {
      setCurrentStep(clampedStep - 1);
    }
  }

  const stepKey = STEP_KEYS[clampedStep - 1];
  const progress = (clampedStep / ONBOARDING_TOTAL_STEPS) * 100;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <View style={{ gap: 24, paddingHorizontal: 16, paddingTop: 16 }}>
        <View>
          <Text className="text-foreground text-2xl font-bold tracking-tight">{t('title')}</Text>
          <Text variant="muted" style={{ marginTop: 4 }}>
            {t('stepOf', { current: clampedStep, total: ONBOARDING_TOTAL_STEPS })}
          </Text>
        </View>

        <Progress value={progress} />

        <View>
          <Text className="text-foreground font-semibold">{t(`steps.${stepKey}`)}</Text>
          <Text variant="muted" style={{ marginTop: 4 }} className="text-sm">
            {t(`stepDescriptions.step${clampedStep}`)}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {clampedStep === 1 && (
          <IdentityStep onNext={handleNext} profile={profile} status={status} />
        )}
        {clampedStep === 2 && <AboutStep onNext={handleNext} profile={profile} />}
        {clampedStep === 3 && <BioStep onNext={handleNext} profile={profile} />}
        {clampedStep === 4 && <PersonalityStep onNext={handleNext} profile={profile} />}
        {clampedStep === 5 && <LanguagesStep onNext={handleNext} profile={profile} />}
        {clampedStep === 6 && <PhotosStep onNext={handleNext} profile={profile} />}
        {clampedStep === 7 && <SecurityStep />}
      </View>

      {clampedStep > 1 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Button variant="ghost" onPress={handleBack}>
            <Text>{tCommon('back')}</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
