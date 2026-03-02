"use client";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_ROOM_PHOTO_SIZE,
  MAX_ROOM_PHOTOS,
  ROOM_PHOTO_SLOTS,
} from "@openhospi/shared/constants";
import { Camera, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { StorageImage } from "@/components/storage-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  const tCommon = useTranslations("common.labels");
  const tErrors = useTranslations("common.errors");
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const slots = ROOM_PHOTO_SLOTS;
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

    if (file.size > MAX_ROOM_PHOTO_SIZE) {
      toast.error(
        tErrors("fileTooLarge", { maxSize: String(Math.round(MAX_ROOM_PHOTO_SIZE / 1024 / 1024)) }),
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

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("roomId", roomId);
        formData.set("slot", String(slot));
        const result = await saveRoomPhoto(formData);
        setUploadingSlot(null);

        if (result.error) {
          if (result.error === "PROCESSING_RESTRICTED") {
            toast.error(tErrors("processingRestricted"));
          } else {
            toast.error(tErrors(result.error));
          }
          return;
        }

        if (result.photo) {
          onPhotosChange([...photos.filter((p) => p.slot !== slot), result.photo]);
        }
      } catch {
        setUploadingSlot(null);
        toast.error(tErrors("uploadFailed"));
      }
    });

    e.target.value = "";
  }

  function handleDelete(slot: number) {
    startTransition(async () => {
      const result = await deleteRoomPhoto(roomId, slot);
      if (result?.error) {
        if (result.error === "PROCESSING_RESTRICTED") {
          toast.error(tErrors("processingRestricted"));
        } else {
          toast.error(tErrors(result.error));
        }
        return;
      }
      onPhotosChange(photos.filter((p) => p.slot !== slot));
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishRoom(roomId);
      if (result?.error) {
        if (result.error === "PROCESSING_RESTRICTED") {
          toast.error(tErrors("processingRestricted"));
        } else {
          toast.error(t(`status.${result.error}`));
        }
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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("wizard.photoGuidance")}</p>
            <span className="text-xs font-medium text-muted-foreground">
              {t("wizard.photoCount", {
                count: String(photos.length),
                max: String(MAX_ROOM_PHOTOS),
              })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slot) => {
              const photo = getPhotoForSlot(slot);
              const isUploading = uploadingSlot === slot;
              const isCover = slot === 1;

              return (
                <div
                  key={slot}
                  className={cn(
                    "relative overflow-hidden rounded-lg border-2 border-dashed",
                    isCover && "col-span-2 row-span-2",
                    isCover ? "aspect-4/3" : "aspect-square",
                    slot === 1 && !photo && "border-primary",
                    photo && "border-solid border-muted",
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
                      {isCover && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Cover
                        </span>
                      )}
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
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            {tCommon("back")}
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
        </CardFooter>
      </Card>
    </div>
  );
}
