"use client";

import { MAX_PROFILE_PHOTOS } from "@openhospi/shared/constants";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ProfilePhoto } from "@/lib/profile";
import { cn } from "@/lib/utils";

import { deleteProfilePhoto, uploadProfilePhoto } from "./profile-actions";

type Props = {
  photos: ProfilePhoto[];
  editable?: boolean;
};

export function PhotosGrid({ photos: initialPhotos, editable }: Props) {
  const t = useTranslations("app.onboarding");
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const slots = Array.from({ length: MAX_PROFILE_PHOTOS }, (_, i) => i + 1);

  function getPhotoForSlot(slot: number) {
    return photos.find((p) => p.slot === slot);
  }

  function handleUploadClick(slot: number) {
    if (!editable) return;
    setActiveSlot(slot);
    fileInputRef.current?.click();
  }

  async function performUpload(slot: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("slot", String(slot));

    const result = await uploadProfilePhoto(formData);
    setUploadingSlot(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.photo) {
      setPhotos((prev) => [...prev.filter((p) => p.slot !== slot), result.photo!]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;

    const slot = activeSlot;
    setUploadingSlot(slot);
    startTransition(() => performUpload(slot, file));

    e.target.value = "";
  }

  async function performDelete(slot: number) {
    const result = await deleteProfilePhoto(slot);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.slot !== slot));
  }

  function handleDelete(slot: number) {
    startTransition(() => performDelete(slot));
  }

  return (
    <div>
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {slots.map((slot) => {
          const photo = getPhotoForSlot(slot);
          const isUploading = uploadingSlot === slot;

          return (
            <div
              key={slot}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2",
                photo ? "border-solid border-muted" : "border-dashed",
                editable && !photo && "cursor-pointer hover:bg-muted/50",
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
                  {editable && (
                    <button
                      type="button"
                      onClick={() => handleDelete(slot)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white transition-opacity hover:bg-black/80"
                      disabled={isPending}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUploadClick(slot)}
                  disabled={!editable || isUploading || isPending}
                  className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center"
                >
                  {isUploading ? (
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="size-5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t(`photoSlots.slot${slot}`)}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
