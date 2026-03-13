"use client";

import { ONBOARDING_TOTAL_STEPS } from "@openhospi/shared/constants";
import type { AboutStepData } from "@openhospi/validators";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import type { ProfilePhoto, ProfileWithPhotos } from "@/lib/queries/profile";

import { AboutStep } from "./steps/about-step";
import { BioStep } from "./steps/bio-step";
import { EmailVerificationStep } from "./steps/email-verification-step";
import { IdentityStep } from "./steps/identity-step";
import { LanguagesStep } from "./steps/languages-step";
import { PersonalityStep } from "./steps/personality-step";
import { PhotosStep } from "./steps/photos-step";
import { SecurityStep } from "./steps/security-step";

type Props = {
  initialData: Partial<ProfileWithPhotos>;
  userId: string;
  emailVerified: boolean;
};

export function OnboardingForm({ initialData, userId, emailVerified }: Props) {
  const t = useTranslations("app.onboarding");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [photos, setPhotos] = useState<ProfilePhoto[]>(initialData.photos ?? []);
  const [isIdentitySubmitted, setIsIdentitySubmitted] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(initialData.email ?? "");
  const [isIdentityVerified, setIsIdentityVerified] = useState(emailVerified);

  const stepTitles = [
    t("steps.identity"),
    t("steps.about"),
    t("steps.bio"),
    t("steps.personality"),
    t("steps.languages"),
    t("steps.photos"),
    t("steps.security"),
  ];

  const stepDescription =
    step === 1 && isIdentitySubmitted && !isIdentityVerified
      ? t("identity.codeStepDescription")
      : t(`stepDescriptions.step${step}`);

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("stepOf", { current: String(step), total: String(ONBOARDING_TOTAL_STEPS) })}
          </span>
          <span>{stepTitles[step - 1]}</span>
        </div>
        <Progress value={(step / ONBOARDING_TOTAL_STEPS) * 100} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{stepTitles[step - 1]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{stepDescription}</p>
      </div>

      {step === 1 && !isIdentitySubmitted && (
        <IdentityStep
          defaultValues={{
            firstName: initialData.firstName ?? "",
            lastName: initialData.lastName ?? "",
            email: initialData.email ?? "",
          }}
          institutionDomain={initialData.institutionDomain}
          onNextAction={(email) => {
            setPendingVerificationEmail(email);
            setIsIdentitySubmitted(true);
            setIsIdentityVerified(false);
          }}
        />
      )}

      {step === 1 && isIdentitySubmitted && !isIdentityVerified && (
        <EmailVerificationStep
          email={pendingVerificationEmail}
          onBack={() => {
            setIsIdentitySubmitted(false);
            setIsIdentityVerified(false);
          }}
          onVerified={() => {
            setIsIdentityVerified(true);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <AboutStep
          defaultValues={{
            gender: (initialData.gender as AboutStepData["gender"]) ?? undefined,
            birthDate: initialData.birthDate ?? "",
            studyProgram: initialData.studyProgram ?? "",
            studyLevel: (initialData.studyLevel as AboutStepData["studyLevel"]) ?? undefined,
            preferredCity:
              (initialData.preferredCity as AboutStepData["preferredCity"]) ?? undefined,
            vereniging: (initialData.vereniging as AboutStepData["vereniging"]) ?? undefined,
          }}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <BioStep
          defaultValue={initialData.bio ?? ""}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <PersonalityStep
          defaultValues={{
            lifestyleTags: (initialData.lifestyleTags as string[]) ?? [],
          }}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <LanguagesStep
          defaultValues={{
            languages: (initialData.languages as string[]) ?? [],
          }}
          onBack={() => setStep(4)}
          onNext={() => setStep(6)}
        />
      )}

      {step === 6 && (
        <PhotosStep
          photos={photos}
          onPhotosChange={setPhotos}
          onBack={() => setStep(5)}
          onNext={() => setStep(7)}
        />
      )}

      {step === 7 && <SecurityStep userId={userId} onBack={() => setStep(6)} />}
    </div>
  );
}
