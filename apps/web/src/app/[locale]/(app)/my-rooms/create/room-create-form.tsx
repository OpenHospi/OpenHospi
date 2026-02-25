"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import type { Room, RoomPhoto } from "@/lib/rooms";
import type { RoomBasicInfoData, RoomDetailsData, RoomPreferencesData } from "@/lib/schemas/room";

import { BasicInfoStep } from "./steps/basic-info-step";
import { DetailsStep } from "./steps/details-step";
import { PhotosStep } from "./steps/photos-step";
import { PreferencesStep } from "./steps/preferences-step";

const TOTAL_STEPS = 4;

type Props = {
  room: Room;
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
            rent_price: room.rent_price || undefined,
            deposit: room.deposit ?? undefined,
            utilities_included: room.utilities_included,
            room_size_m2: room.room_size_m2 ?? undefined,
            available_from: room.available_from ?? "",
            available_until: room.available_until ?? "",
            rental_type: room.rental_type as RoomDetailsData["rental_type"],
            house_type: (room.house_type as RoomDetailsData["house_type"]) ?? undefined,
            furnishing: (room.furnishing as RoomDetailsData["furnishing"]) ?? undefined,
            total_housemates: room.total_housemates ?? undefined,
          }}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <PreferencesStep
          roomId={room.id}
          defaultValues={{
            features: room.features as RoomPreferencesData["features"],
            location_tags: room.location_tags as RoomPreferencesData["location_tags"],
            preferred_gender: room.preferred_gender as RoomPreferencesData["preferred_gender"],
            preferred_age_min: room.preferred_age_min ?? undefined,
            preferred_age_max: room.preferred_age_max ?? undefined,
            preferred_lifestyle_tags:
              room.preferred_lifestyle_tags as RoomPreferencesData["preferred_lifestyle_tags"],
            room_vereniging:
              room.room_vereniging as RoomPreferencesData["room_vereniging"],
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
