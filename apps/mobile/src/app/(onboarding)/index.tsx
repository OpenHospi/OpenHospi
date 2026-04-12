import { ONBOARDING_TOTAL_STEPS } from '@openhospi/shared/constants';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedProgress } from '@/components/primitives/themed-progress';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { useOnboardingStatus } from '@/services/onboarding';
import { useProfile } from '@/services/profile';

import AboutStep from './steps/about-step';
import BioStep from './steps/bio-step';
import IdentityStep from './steps/identity-step';
import LanguagesStep from './steps/languages-step';
import PersonalityStep from './steps/personality-step';
import PhotosStep from './steps/photos-step';
import SecurityStep from './steps/security-step';
import type { StepHandle } from '@/components/shared/onboarding-types';

const STEP_KEYS = [
  'identity',
  'about',
  'bio',
  'personality',
  'languages',
  'photos',
  'security',
] as const;

// Steps 1 (identity) and 7 (security) manage their own buttons
const SELF_MANAGED_STEPS = new Set([1, 7]);

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { data: status, isPending: statusPending } = useOnboardingStatus();
  const { data: profile, isPending: profilePending } = useProfile();
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const stepRef = useRef<StepHandle>(null);

  const step = currentStep ?? status?.currentStep ?? 1;
  const clampedStep = Math.min(step, ONBOARDING_TOTAL_STEPS);

  if (statusPending || profilePending) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <ThemedSkeleton width="50%" height={28} />
          <ThemedSkeleton width="100%" height={8} rounded="full" />
          <ThemedSkeleton width="40%" height={22} />
        </View>
        <View style={styles.skeletonContent}>
          <ThemedSkeleton width="100%" height={44} rounded="lg" />
          <ThemedSkeleton width="100%" height={44} rounded="lg" />
          <ThemedSkeleton width="70%" height={44} rounded="lg" />
        </View>
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

  function handleNextPress() {
    if (stepRef.current) {
      stepRef.current.submit();
    } else {
      handleNext();
    }
  }

  const stepKey = STEP_KEYS[clampedStep - 1];
  const progress = (clampedStep / ONBOARDING_TOTAL_STEPS) * 100;
  const showBottomBar = !SELF_MANAGED_STEPS.has(clampedStep);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <ThemedText variant="title2">{t('title')}</ThemedText>
          <ThemedText variant="footnote" color={colors.tertiaryForeground} style={styles.stepOf}>
            {t('stepOf', { current: clampedStep, total: ONBOARDING_TOTAL_STEPS })}
          </ThemedText>
        </View>

        <ThemedProgress value={progress} />

        <View>
          <ThemedText variant="headline">{t(`steps.${stepKey}`)}</ThemedText>
          <ThemedText
            variant="footnote"
            color={colors.tertiaryForeground}
            style={styles.stepDescription}>
            {t(`stepDescriptions.step${clampedStep}`)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.stepContent}>
        {clampedStep === 1 && (
          <IdentityStep onNext={handleNext} profile={profile} status={status} />
        )}
        {clampedStep === 2 && <AboutStep ref={stepRef} onNext={handleNext} profile={profile} />}
        {clampedStep === 3 && <BioStep ref={stepRef} onNext={handleNext} profile={profile} />}
        {clampedStep === 4 && (
          <PersonalityStep ref={stepRef} onNext={handleNext} profile={profile} />
        )}
        {clampedStep === 5 && <LanguagesStep ref={stepRef} onNext={handleNext} profile={profile} />}
        {clampedStep === 6 && <PhotosStep ref={stepRef} onNext={handleNext} profile={profile} />}
        {clampedStep === 7 && <SecurityStep />}
      </View>

      {showBottomBar && (
        <View style={styles.bottomBar}>
          {clampedStep > 1 ? (
            <ThemedButton variant="ghost" onPress={handleBack} style={styles.bottomBarButton}>
              {tCommon('back')}
            </ThemedButton>
          ) : (
            <View style={styles.bottomBarButton} />
          )}
          <ThemedButton onPress={handleNextPress} style={styles.bottomBarButton}>
            {tCommon('next')}
          </ThemedButton>
        </View>
      )}

      {!showBottomBar && clampedStep > 1 && (
        <View style={styles.backOnlyBar}>
          <ThemedButton variant="ghost" onPress={handleBack}>
            {tCommon('back')}
          </ThemedButton>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  stepOf: {
    marginTop: 4,
  },
  stepDescription: {
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  bottomBarButton: {
    flex: 1,
  },
  backOnlyBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
