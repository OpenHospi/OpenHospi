"use client";

import { ROOM_CREATE_TOTAL_STEPS } from "@openhospi/shared/constants";
import type {
  RoomBasicInfoData,
  RoomDetailsData,
  RoomPreferencesData,
} from "@openhospi/database/validators";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import type { RoomPhoto, RoomWithPhotos } from "@/lib/rooms";
import { cn } from "@/lib/utils";

import { BasicInfoStep } from "./steps/basic-info-step";
import { DetailsStep } from "./steps/details-step";
import { PhotosStep } from "./steps/photos-step";
import { PreferencesStep } from "./steps/preferences-step";

type Props = {
  room: RoomWithPhotos;
};

export function RoomCreateForm({ room }: Props) {
  const t = useTranslations("app.rooms");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<RoomPhoto[]>(room.photos);

  const stepKeys = ["basicInfo", "details", "preferences", "photos"] as const;

  function handlePublished() {
    router.push(`/${locale}/my-rooms/${room.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Visual Stepper */}
      <nav aria-label="Progress" className="px-2">
        <ol className="flex items-center">
          {stepKeys.map((key, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            const isClickable = stepNum < step;

            return (
              <li
                key={key}
                className={cn("relative flex items-center", index < ROOM_CREATE_TOTAL_STEPS - 1 && "flex-1")}
              >
                <button
                  type="button"
                  onClick={() => isClickable && setStep(stepNum)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90",
                    isCurrent && "border-primary bg-background text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border-muted bg-background text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? <Check className="size-4" /> : stepNum}
                </button>

                {/* Step label — visible on sm+ */}
                <span
                  className={cn(
                    "absolute top-full mt-2 hidden text-center text-xs sm:block",
                    "left-1/2 w-max -translate-x-1/2",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t(`wizard.steps.${key}`)}
                </span>

                {/* Connector line */}
                {index < ROOM_CREATE_TOTAL_STEPS - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1 transition-colors",
                      stepNum < step ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div className="pt-6 sm:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            {t(`wizard.steps.${stepKeys[step - 1]}`)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`wizard.stepDescriptions.step${step}`)}
          </p>
        </div>

        {step === 1 && (
          <BasicInfoStep
            roomId={room.id}
            defaultValues={{
              title: room.title || undefined,
              description: room.description ?? undefined,
              city: room.city as RoomBasicInfoData["city"],
              neighborhood: room.neighborhood ?? undefined,
              streetName: room.streetName ?? undefined,
              houseNumber: room.houseNumber ?? undefined,
              postalCode: room.postalCode ?? undefined,
              latitude: room.latitude ?? undefined,
              longitude: room.longitude ?? undefined,
            }}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <DetailsStep
            roomId={room.id}
            defaultValues={{
              rentPrice: Number(room.rentPrice) || undefined,
              deposit: room.deposit ? Number(room.deposit) : undefined,
              utilitiesIncluded:
                (room.utilitiesIncluded as RoomDetailsData["utilitiesIncluded"]) ?? undefined,
              serviceCosts: room.serviceCosts ? Number(room.serviceCosts) : undefined,
              estimatedUtilitiesCosts: room.estimatedUtilitiesCosts
                ? Number(room.estimatedUtilitiesCosts)
                : undefined,
              roomSizeM2: room.roomSizeM2 ?? undefined,
              availableFrom: room.availableFrom ?? "",
              availableUntil: room.availableUntil ?? "",
              rentalType: room.rentalType as RoomDetailsData["rentalType"],
              houseType: (room.houseType as RoomDetailsData["houseType"]) ?? undefined,
              furnishing: (room.furnishing as RoomDetailsData["furnishing"]) ?? undefined,
              totalHousemates: room.totalHousemates ?? undefined,
            }}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <PreferencesStep
            roomId={room.id}
            defaultValues={{
              features: (room.features as RoomPreferencesData["features"]) ?? [],
              locationTags: (room.locationTags as RoomPreferencesData["locationTags"]) ?? [],
              preferredGender: room.preferredGender as RoomPreferencesData["preferredGender"],
              preferredAgeMin: room.preferredAgeMin ?? undefined,
              preferredAgeMax: room.preferredAgeMax ?? undefined,
              acceptedLanguages:
                (room.acceptedLanguages as RoomPreferencesData["acceptedLanguages"]) ?? [],
              roomVereniging: room.roomVereniging as RoomPreferencesData["roomVereniging"],
            }}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <PhotosStep
            roomId={room.id}
            photos={photos}
            onPhotosChange={setPhotos}
            onBack={() => setStep(3)}
            onPublished={handlePublished}
          />
        )}
      </div>
    </div>
  );
}
