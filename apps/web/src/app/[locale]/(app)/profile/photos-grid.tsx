"use client";

import {
  MAX_AVATAR_SIZE,
  MAX_PROFILE_PHOTOS,
  STORAGE_BUCKET_PROFILE_PHOTOS,
} from "@openhospi/shared/constants";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import { SortablePhotoGrid, type SortablePhoto } from "@/components/shared/sortable-photo-grid";
import { Badge } from "@/components/ui/badge";
import type { ProfilePhoto } from "@/lib/queries/profile";

import { deleteProfilePhoto, reorderProfilePhotos, saveProfilePhoto } from "./profile-actions";

type Props = {
  photos: ProfilePhoto[];
  editable?: boolean;
};

const SLOTS = Array.from({ length: MAX_PROFILE_PHOTOS }, (_, i) => i + 1);

export function PhotosGrid({ photos, editable }: Props) {
  const t = useTranslations("app.onboarding");
  const tErrors = useTranslations("common.errors");

  const getSlotLabel = useCallback(
    (slot: number) => t(`photoSlots.slot${slot}` as Parameters<typeof t>[0]),
    [t],
  );

  const handleUpload = useCallback(
    async (slot: number, file: File): Promise<SortablePhoto | null> => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("slot", String(slot));
      const result = await saveProfilePhoto(formData);
      if (result.error) {
        toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]));
        return null;
      }
      return result.photo ?? null;
    },
    [tErrors],
  );

  const handleDelete = useCallback(
    async (slot: number): Promise<boolean> => {
      const result = await deleteProfilePhoto(slot);
      if (result?.error) {
        toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]));
        return false;
      }
      return true;
    },
    [tErrors],
  );

  const handleReorder = useCallback(
    async (swaps: { photoId: string; newSlot: number }[]): Promise<boolean> => {
      const result = await reorderProfilePhotos(swaps);
      if (result.error) {
        toast.error(tErrors(result.error as Parameters<typeof tErrors>[0]));
        return false;
      }
      return true;
    },
    [tErrors],
  );

  const renderPhotoOverlay = useCallback(
    (_photo: SortablePhoto, slot: number) => (
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 pt-6">
        {slot === 1 && <Badge className="mb-1">{t("required")}</Badge>}
        <p className="text-xs font-medium text-white">{getSlotLabel(slot)}</p>
      </div>
    ),
    [t, getSlotLabel],
  );

  return (
    <SortablePhotoGrid
      photos={photos}
      slots={SLOTS}
      bucket={STORAGE_BUCKET_PROFILE_PHOTOS}
      maxFileSize={MAX_AVATAR_SIZE}
      editable={editable}
      getSlotLabel={getSlotLabel}
      dragLabel={t("dragToReorder")}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onReorder={handleReorder}
      renderPhotoOverlay={renderPhotoOverlay}
      highlightEmptySlot={1}
      gridClassName="grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
    />
  );
}
