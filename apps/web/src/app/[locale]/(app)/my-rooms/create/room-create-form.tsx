"use client";

import type { RoomBasicInfoData, RoomDetailsData, RoomPreferencesData } from "@openhospi/database/validators";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import type { RoomPhoto, RoomWithPhotos } from "@/lib/rooms";

import { BasicInfoStep } from "./steps/basic-info-step";
import { DetailsStep } from "./steps/details-step";
import { PhotosStep } from "./steps/photos-step";
import { PreferencesStep } from "./steps/preferences-step";

const TOTAL_STEPS = 4;

type Props = {
  room: RoomWithPhotos;
};

export function RoomCreateForm({ room }: Props) {
  const t = useTranslations("app.rooms");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<RoomPhoto[]>(room.photos);

  const stepTitles = [
    t("wizard.steps.basicInfo"),
    t("wizard.steps.details"),
    t("wizard.steps.preferences"),
    t("wizard.steps.photos"),
  ];

  function handlePublished() {
    router.push(`/${locale}/my-rooms/${room.id}`);
  }

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("wizard.stepOf", { current: step, total: TOTAL_STEPS })}</span>
          <span>{stepTitles[step - 1]}</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{stepTitles[step - 1]}</h1>
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
            address: room.address ?? undefined,
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
            utilitiesIncluded: room.utilitiesIncluded ?? false,
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
            preferredLifestyleTags:
              (room.preferredLifestyleTags as RoomPreferencesData["preferredLifestyleTags"]) ?? [],
            roomVereniging:
              room.roomVereniging as RoomPreferencesData["roomVereniging"],
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
  );
}
