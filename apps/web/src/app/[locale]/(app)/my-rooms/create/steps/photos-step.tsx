"use client";

import {
  MAX_ROOM_PHOTO_SIZE,
  MAX_ROOM_PHOTOS,
  ROOM_PHOTO_SLOTS,
} from "@openhospi/shared/constants";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

import { SortablePhotoGrid, type SortablePhoto } from "@/components/shared/sortable-photo-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { RoomPhoto } from "@/lib/queries/rooms";

import { publishRoom } from "../actions";
import {
  deleteRoomPhoto,
  reorderRoomPhotos,
  saveRoomPhoto,
  updatePhotoCaption,
} from "../photo-actions";

type Props = {
  roomId: string;
  photos: RoomPhoto[];
  onPhotosChange: (photos: RoomPhoto[]) => void;
  onBack: () => void;
  onPublished: () => void;
};

const SLOTS = [...ROOM_PHOTO_SLOTS];

export function PhotosStep({ roomId, photos, onPhotosChange, onBack, onPublished }: Props) {
  const t = useTranslations("app.rooms");
  const tCommon = useTranslations("common.labels");
  const tErrors = useTranslations("common.errors");
  const [isPending, startTransition] = useTransition();

  const hasPhoto = photos.length > 0;

  const getSlotLabel = useCallback(
    (slot: number) => t(`photoSlots.slot${slot}` as Parameters<typeof t>[0]),
    [t],
  );

  const getSlotClassName = useCallback(
    (slot: number) => (slot === 1 ? "col-span-2 row-span-2 aspect-4/3" : "aspect-square"),
    [],
  );

  const handleUpload = useCallback(
    async (slot: number, file: File): Promise<SortablePhoto | null> => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("roomId", roomId);
      formData.set("slot", String(slot));
      const result = await saveRoomPhoto(formData);
      if (result.error) {
        if (result.error === "PROCESSING_RESTRICTED") {
          toast.error(tErrors("processingRestricted"));
        } else {
          toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]));
        }
        return null;
      }
      return result.photo ?? null;
    },
    [roomId, tErrors],
  );

  const handleDelete = useCallback(
    async (slot: number): Promise<boolean> => {
      const result = await deleteRoomPhoto(roomId, slot);
      if (result?.error) {
        if (result.error === "PROCESSING_RESTRICTED") {
          toast.error(tErrors("processingRestricted"));
        } else {
          toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]));
        }
        return false;
      }
      return true;
    },
    [roomId, tErrors],
  );

  const handleReorder = useCallback(
    async (swaps: { photoId: string; newSlot: number }[]): Promise<boolean> => {
      const result = await reorderRoomPhotos(roomId, swaps);
      if (result.error) {
        toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]));
        return false;
      }
      return true;
    },
    [roomId, tErrors],
  );

  const handleCaptionSave = useCallback(
    async (slot: number, caption: string | null): Promise<boolean> => {
      const result = await updatePhotoCaption(roomId, slot, caption);
      if (result?.error) {
        toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]));
        return false;
      }
      return true;
    },
    [roomId, tErrors],
  );

  const handlePhotosChange = useCallback(
    (newPhotos: SortablePhoto[]) => {
      onPhotosChange(newPhotos as RoomPhoto[]);
    },
    [onPhotosChange],
  );

  const renderPhotoOverlay = useCallback(
    (_photo: SortablePhoto, slot: number) =>
      slot === 1 ? (
        <span className="absolute bottom-1 left-8 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Cover
        </span>
      ) : null,
    [],
  );

  function handlePublish() {
    startTransition(async () => {
      const result = await publishRoom(roomId);
      if (result?.error) {
        if (result.error === "PROCESSING_RESTRICTED") {
          toast.error(tErrors("processingRestricted"));
        } else {
          toast.error(t(`status.${result.error}` as Parameters<typeof t>[0]));
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

          <SortablePhotoGrid
            photos={photos}
            slots={SLOTS}
            bucket="room-photos"
            maxFileSize={MAX_ROOM_PHOTO_SIZE}
            editable
            getSlotLabel={getSlotLabel}
            dragLabel={t("dragToReorder")}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onPhotosChange={handlePhotosChange}
            onCaptionSave={handleCaptionSave}
            captionPlaceholder={t("captions.placeholder")}
            renderPhotoOverlay={renderPhotoOverlay}
            highlightEmptySlot={1}
            getSlotClassName={getSlotClassName}
            gridClassName="grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          />
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
