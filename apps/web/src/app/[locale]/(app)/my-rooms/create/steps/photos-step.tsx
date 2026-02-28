"use client";

import { MAX_ROOM_PHOTOS } from "@openhospi/shared/constants";
import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { RoomPhoto } from "@/lib/rooms";
import { cn } from "@/lib/utils";

import { publishRoom } from "../actions";
import { deleteRoomPhoto, saveRoomPhoto } from "../photo-actions";

type Props = {
  roomId: string;
  photos: RoomPhoto[];
  onPhotosChange: (photos: RoomPhoto[]) => void;
  onBack: () => void;
  onPublished: () => void;
};

export function PhotosStep({ roomId, photos, onPhotosChange, onBack, onPublished }: Props) {
  const t = useTranslations("app.rooms");
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const slots = Array.from({ length: MAX_ROOM_PHOTOS }, (_, i) => i + 1);
  const hasPhoto = photos.length > 0;

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
      const result = await deleteRoomPhoto(roomId, slot);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      onPhotosChange(photos.filter((p) => p.slot !== slot));
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishRoom(roomId);
      if (result?.error) {
        toast.error(t(`status.${result.error}`));
        return;
      }
      toast.success(t("status.published"));
      onPublished();
    });
  }

  function handleSaveDraft() {
    toast.success(t("status.draftSaved"));
    onPublished();
  }

  return (
    <div className="space-y-6">
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
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isPending}>
          {t("actions.back")}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isPending}>
            {t("actions.saveDraft")}
          </Button>
          <Button onClick={handlePublish} disabled={!hasPhoto || isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {t("actions.publish")}
          </Button>
        </div>
      </div>
    </div>
  );
}
