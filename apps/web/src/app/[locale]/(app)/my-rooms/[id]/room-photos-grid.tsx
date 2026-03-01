"use client";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_ROOM_PHOTO_SIZE,
  MAX_ROOM_PHOTOS,
} from "@openhospi/shared/constants";
import { Camera, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { StorageImage } from "@/components/storage-image";
import { Button } from "@/components/ui/button";
import type { RoomPhoto } from "@/lib/rooms";
import { cn } from "@/lib/utils";

import { deleteRoomPhoto, saveRoomPhoto } from "../create/photo-actions";

type Props = {
  roomId: string;
  photos: RoomPhoto[];
};

export function RoomPhotosGrid({ roomId, photos: initialPhotos }: Props) {
  const t = useTranslations("app.rooms");
  const tErrors = useTranslations("common.errors");
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const slots = Array.from({ length: MAX_ROOM_PHOTOS }, (_, i) => i + 1);

  function getPhotoForSlot(slot: number) {
    return photos.find((p) => p.slot === slot);
  }

  function handleUploadClick(slot: number) {
    setActiveSlot(slot);
    fileInputRef.current?.click();
  }

  async function performUpload(slot: number, file: File) {
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("roomId", roomId);
      formData.set("slot", String(slot));
      const result = await saveRoomPhoto(formData);
      setUploadingSlot(null);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.photo) {
        setPhotos((prev) => [...prev.filter((p) => p.slot !== slot), result.photo!]);
      }
    } catch {
      setUploadingSlot(null);
      toast.error(tErrors("uploadFailed"));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;

    if (file.size > MAX_ROOM_PHOTO_SIZE) {
      toast.error(
        tErrors("fileTooLarge", { maxSize: Math.round(MAX_ROOM_PHOTO_SIZE / 1024 / 1024) }),
      );
      e.target.value = "";
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      toast.error(tErrors("invalidFileType"));
      e.target.value = "";
      return;
    }

    const slot = activeSlot;
    setUploadingSlot(slot);
    startTransition(() => performUpload(slot, file));

    e.target.value = "";
  }

  async function performDelete(slot: number) {
    const result = await deleteRoomPhoto(roomId, slot);
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {slots.map((slot) => {
          const photo = getPhotoForSlot(slot);
          const isUploading = uploadingSlot === slot;

          return (
            <div
              key={slot}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2",
                photo
                  ? "border-solid border-muted"
                  : "border-dashed cursor-pointer hover:bg-muted/50",
              )}
            >
              {photo ? (
                <>
                  <StorageImage
                    src={photo.url}
                    alt={t(`photoSlots.slot${slot}`)}
                    bucket="room-photos"
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
                  className="size-full flex-col gap-1 p-2"
                >
                  {isUploading ? (
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="size-5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {t(`photoSlots.slot${slot}`)}
                  </span>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
