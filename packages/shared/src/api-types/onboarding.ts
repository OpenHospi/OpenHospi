export type OnboardingStatus = {
  emailVerified: boolean;
  hasIdentity: boolean;
  hasAbout: boolean;
  hasBio: boolean;
  hasPersonality: boolean;
  hasLanguages: boolean;
  hasPhotos: boolean;
  hasSecurity: boolean;
  isComplete: boolean;
  currentStep: number;
};
