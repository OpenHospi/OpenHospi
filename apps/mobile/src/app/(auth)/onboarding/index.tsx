import { ONBOARDING_TOTAL_STEPS } from '@openhospi/shared/constants';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslations } from '@/i18n';
import { useOnboardingStatus } from '@/services/onboarding';

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
  const t = useTranslations('app.onboarding');
  const tCommon = useTranslations('common.labels');
  const { data: status, isPending } = useOnboardingStatus();
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const step = currentStep ?? status?.currentStep ?? 1;
  const clampedStep = Math.min(step, ONBOARDING_TOTAL_STEPS);

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
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
  const progress = clampedStep / ONBOARDING_TOTAL_STEPS;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4">
        <Text className="text-lg font-bold text-foreground">{t('title')}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {t('stepOf', { current: clampedStep, total: ONBOARDING_TOTAL_STEPS })}
        </Text>

        <View className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress * 100}%` }}
          />
        </View>

        <Text className="mt-3 text-base font-semibold text-foreground">
          {t(`steps.${stepKey}`)}
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {t(`stepDescriptions.step${clampedStep}`)}
        </Text>
      </View>

      <View className="flex-1 px-4 pt-4">
        {clampedStep === 1 && <IdentityStep onNext={handleNext} />}
        {clampedStep === 2 && <AboutStep onNext={handleNext} />}
        {clampedStep === 3 && <BioStep onNext={handleNext} />}
        {clampedStep === 4 && <PersonalityStep onNext={handleNext} />}
        {clampedStep === 5 && <LanguagesStep onNext={handleNext} />}
        {clampedStep === 6 && <PhotosStep onNext={handleNext} />}
        {clampedStep === 7 && <SecurityStep />}
      </View>

      {clampedStep > 1 && (
        <View className="px-4 pb-4">
          <Pressable onPress={handleBack} className="items-center py-3">
            <Text className="text-sm font-medium text-muted-foreground">{tCommon('back')}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
