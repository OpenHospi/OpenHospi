"use client";

import { MAX_PROFILE_PHOTOS } from "@openhospi/shared/constants";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ProfilePhoto } from "@/lib/profile";
import { uploadPhotoToBlob } from "@/lib/upload-photo";
import { cn } from "@/lib/utils";

import { deletePhoto, savePhoto } from "../photo-actions";

type Props = {
  photos: ProfilePhoto[];
  onPhotosChange: (photos: ProfilePhoto[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export function PhotosStep({ photos, onPhotosChange, onBack, onNext }: Props) {
  const t = useTranslations("app.onboarding");
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const slots = Array.from({ length: MAX_PROFILE_PHOTOS }, (_, i) => i + 1);
  const hasRequiredPhoto = photos.some((p) => p.slot === 1);

  function getPhotoForSlot(slot: number) {
    return photos.find((p) => p.slot === slot);
  }

  function handleUploadClick(slot: number) {
    setActiveSlot(slot);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;

    const slot = activeSlot;
    setUploadingSlot(slot);

    startTransition(async () => {
      try {
        const url = await uploadPhotoToBlob(file, "profile-photos", slot, "profile");
        const result = await savePhoto(url, slot);
        setUploadingSlot(null);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (result.photo) {
          onPhotosChange([...photos.filter((p) => p.slot !== slot), result.photo]);
        }
      } catch {
        setUploadingSlot(null);
        toast.error("Upload failed");
      }
    });

    e.target.value = "";
  }

  function handleDelete(slot: number) {
    startTransition(async () => {
      const result = await deletePhoto(slot);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onPhotosChange(photos.filter((p) => p.slot !== slot));
    });
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.map((slot) => {
          const photo = getPhotoForSlot(slot);
          const isUploading = uploadingSlot === slot;

          return (
            <div
              key={slot}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 border-dashed",
                slot === 1 && !photo && "border-primary",
                photo && "border-solid border-muted",
              )}
            >
              {photo ? (
                <>
                  <Image
                    src={photo.url}
                    alt={t(`photoSlots.slot${slot}`)}
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(slot)}
                    className="absolute top-1 right-1 size-auto rounded-full bg-black/60 p-1 text-white hover:bg-black/80 hover:text-white"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => handleUploadClick(slot)}
                  disabled={isUploading || isPending}
                  className="size-full flex-col gap-1 p-2 hover:bg-muted/50"
                >
                  {isUploading ? (
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="size-6 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t(`photoSlots.slot${slot}`)}
                  </span>
                  {slot === 1 && (
                    <span className="text-xs font-medium text-primary">{t("required")}</span>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {t("back")}
        </Button>
        <Button onClick={onNext} disabled={!hasRequiredPhoto || isPending}>
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
