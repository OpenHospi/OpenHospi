"use client";

import { MAX_ROOM_PHOTO_SIZE, ROOM_PHOTO_SLOTS } from "@openhospi/shared/constants";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  SortablePhotoGrid,
  type SortablePhoto,
} from "@/components/app/sortable-photo-grid";
import type { RoomPhoto } from "@/lib/rooms";

import { deleteRoomPhoto, reorderRoomPhotos, saveRoomPhoto, updatePhotoCaption } from "../create/photo-actions";

type Props = {
  roomId: string;
  photos: RoomPhoto[];
};

const SLOTS = [...ROOM_PHOTO_SLOTS];

export function RoomPhotosGrid({ roomId, photos }: Props) {
  const t = useTranslations("app.rooms");
  const tErrors = useTranslations("common.errors");

  const getSlotLabel = useCallback(
    (slot: number) => t(`photoSlots.slot${slot}` as Parameters<typeof t>[0]),
    [t],
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

  return (
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
      onCaptionSave={handleCaptionSave}
      captionPlaceholder={t("captions.placeholder")}
      gridClassName="grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
    />
  );
}
