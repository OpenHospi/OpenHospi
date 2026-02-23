"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import type { Profile, ProfilePhoto } from "@/lib/profile";
import type { AboutStepData, PreferencesStepData } from "@/lib/schemas/profile";

import { AboutStep } from "./steps/about-step";
import { PersonalityStep } from "./steps/personality-step";
import { PhotosStep } from "./steps/photos-step";
import { PreferencesStep } from "./steps/preferences-step";

const TOTAL_STEPS = 4;

type Props = {
  initialData: Partial<Profile>;
};

export function OnboardingForm({ initialData }: Props) {
  const t = useTranslations("app.onboarding");
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<ProfilePhoto[]>(initialData.photos ?? []);

  const stepTitles = [
    t("steps.about"),
    t("steps.personality"),
    t("steps.photos"),
    t("steps.preferences"),
  ];

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("stepOf", { current: step, total: TOTAL_STEPS })}</span>
          <span>{stepTitles[step - 1]}</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{stepTitles[step - 1]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(`stepDescriptions.step${step}`)}</p>
      </div>

      {step === 1 && (
        <AboutStep
          defaultValues={{
            gender: (initialData.gender as AboutStepData["gender"]) ?? undefined,
            birth_date: initialData.birth_date ?? "",
            study_program: initialData.study_program ?? "",
            study_level: (initialData.study_level as AboutStepData["study_level"]) ?? undefined,
            bio: initialData.bio ?? "",
          }}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <PersonalityStep
          defaultValues={{
            lifestyle_tags: (initialData.lifestyle_tags as string[]) ?? [],
          }}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <PhotosStep
          photos={photos}
          onPhotosChange={setPhotos}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <PreferencesStep
          defaultValues={{
            preferred_city:
              (initialData.preferred_city as PreferencesStepData["preferred_city"]) ?? undefined,
            max_rent: initialData.max_rent ?? undefined,
            available_from: initialData.available_from ?? "",
            vereniging: initialData.vereniging ?? "",
            instagram_handle: initialData.instagram_handle ?? "",
            show_instagram: initialData.show_instagram ?? false,
          }}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  );
}
