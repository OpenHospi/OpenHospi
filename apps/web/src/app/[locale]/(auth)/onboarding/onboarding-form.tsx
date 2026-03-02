"use client";

import type { AboutStepData, PreferencesStepData } from "@openhospi/database/validators";
import { ONBOARDING_TOTAL_STEPS } from "@openhospi/shared/constants";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import type { ProfilePhoto, ProfileWithPhotos } from "@/lib/profile";

import { AboutStep } from "./steps/about-step";
import { LanguagesStep } from "./steps/languages-step";
import { PersonalityStep } from "./steps/personality-step";
import { PhotosStep } from "./steps/photos-step";
import { PreferencesStep } from "./steps/preferences-step";

type Props = {
  initialData: Partial<ProfileWithPhotos>;
};

export function OnboardingForm({ initialData }: Props) {
  const t = useTranslations("app.onboarding");
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<ProfilePhoto[]>(initialData.photos ?? []);

  const stepTitles = [
    t("steps.about"),
    t("steps.personality"),
    t("steps.languages"),
    t("steps.photos"),
    t("steps.preferences"),
  ];

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("stepOf", { current: step, total: ONBOARDING_TOTAL_STEPS })}</span>
          <span>{stepTitles[step - 1]}</span>
        </div>
        <Progress value={(step / ONBOARDING_TOTAL_STEPS) * 100} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{stepTitles[step - 1]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(`stepDescriptions.step${step}` as any)}</p>
      </div>

      {step === 1 && (
        <AboutStep
          defaultValues={{
            gender: (initialData.gender as AboutStepData["gender"]) ?? undefined,
            birthDate: initialData.birthDate ?? "",
            studyProgram: initialData.studyProgram ?? "",
            studyLevel: (initialData.studyLevel as AboutStepData["studyLevel"]) ?? undefined,
            bio: initialData.bio ?? "",
          }}
          institutionDomain={initialData.institutionDomain}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <PersonalityStep
          defaultValues={{
            lifestyleTags: (initialData.lifestyleTags as string[]) ?? [],
          }}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <LanguagesStep
          defaultValues={{
            languages: (initialData.languages as string[]) ?? [],
          }}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <PhotosStep
          photos={photos}
          onPhotosChange={setPhotos}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <PreferencesStep
          defaultValues={{
            preferredCity:
              (initialData.preferredCity as PreferencesStepData["preferredCity"]) ?? undefined,
            maxRent: initialData.maxRent ? Number(initialData.maxRent) : undefined,
            availableFrom: initialData.availableFrom ?? "",
            vereniging: (initialData.vereniging as PreferencesStepData["vereniging"]) ?? undefined,
          }}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}
