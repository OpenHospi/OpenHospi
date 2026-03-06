"use client";

import { MAX_AVATAR_SIZE, MAX_PROFILE_PHOTOS } from "@openhospi/shared/constants";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  deleteProfilePhoto,
  reorderProfilePhotos,
  saveProfilePhoto,
} from "@/app/[locale]/(app)/profile/profile-actions";
import { SortablePhotoGrid, type SortablePhoto } from "@/components/shared/sortable-photo-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfilePhoto } from "@/lib/queries/profile";

type Props = {
  photos: ProfilePhoto[];
  onPhotosChange: (photos: ProfilePhoto[]) => void;
  onBack: () => void;
  onNext: () => void;
};

const SLOTS = Array.from({ length: MAX_PROFILE_PHOTOS }, (_, i) => i + 1);

export function PhotosStep({ photos, onPhotosChange, onBack, onNext }: Props) {
  const t = useTranslations("app.onboarding");
  const tCommon = useTranslations("common.labels");
  const tErrors = useTranslations("common.errors");

  const hasRequiredPhoto = photos.some((p) => p.slot === 1);

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

  const handlePhotosChange = useCallback(
    (newPhotos: SortablePhoto[]) => {
      onPhotosChange(newPhotos as ProfilePhoto[]);
    },
    [onPhotosChange],
  );

  const renderPhotoOverlay = useCallback(
    (_photo: SortablePhoto, slot: number) => (
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
        {slot === 1 && <Badge className="mb-1">{t("required")}</Badge>}
        <p className="text-xs font-medium text-white">{getSlotLabel(slot)}</p>
      </div>
    ),
    [t, getSlotLabel],
  );

  const renderEmptyExtra = useCallback(
    (slot: number) =>
      slot === 1 ? <span className="text-xs font-medium text-primary">{t("required")}</span> : null,
    [t],
  );

  return (
    <div className="space-y-6">
      <SortablePhotoGrid
        photos={photos}
        slots={SLOTS}
        bucket="profile-photos"
        maxFileSize={MAX_AVATAR_SIZE}
        editable
        getSlotLabel={getSlotLabel}
        dragLabel={t("dragToReorder")}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onPhotosChange={handlePhotosChange}
        renderPhotoOverlay={renderPhotoOverlay}
        renderEmptyExtra={renderEmptyExtra}
        highlightEmptySlot={1}
        gridClassName="grid-cols-2 gap-3 sm:grid-cols-3"
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          {tCommon("back")}
        </Button>
        <Button onClick={onNext} disabled={!hasRequiredPhoto}>
          {tCommon("next")}
        </Button>
      </div>
    </div>
  );
}
