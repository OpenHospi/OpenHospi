"use client";

import {ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE, MAX_PROFILE_PHOTOS} from "@openhospi/shared/constants";
import {Camera, Loader2, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useRef, useState, useTransition} from "react";
import {toast} from "sonner";

import {deleteProfilePhoto, saveProfilePhoto} from "@/app/[locale]/(app)/profile/profile-actions";
import {StorageImage} from "@/components/storage-image";
import {Button} from "@/components/ui/button";
import type {ProfilePhoto} from "@/lib/profile";
import {cn} from "@/lib/utils";

type Props = {
    photos: ProfilePhoto[];
    onPhotosChange: (photos: ProfilePhoto[]) => void;
    onBack: () => void;
    onNext: () => void;
};

export function PhotosStep({photos, onPhotosChange, onBack, onNext}: Props) {
    const t = useTranslations("app.onboarding");
    const tErrors = useTranslations("common.errors");
    const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);

    const slots = Array.from({length: MAX_PROFILE_PHOTOS}, (_, i) => i + 1);
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

        if (file.size > MAX_AVATAR_SIZE) {
            toast.error(tErrors("fileTooLarge", {maxSize: Math.round(MAX_AVATAR_SIZE / 1024 / 1024)}));
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
                formData.set("slot", String(slot));
                const result = await saveProfilePhoto(formData);
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
                toast.error(tErrors("uploadFailed"));
            }
        });

        e.target.value = "";
    }

    function handleDelete(slot: number) {
        startTransition(async () => {
            const result = await deleteProfilePhoto(slot);
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
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
                                    <StorageImage
                                        src={photo.url}
                                        alt={t(`photoSlots.slot${slot}`)}
                                        bucket="profile-photos"
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
                                        <X className="size-4"/>
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
                                        <Loader2 className="size-6 animate-spin text-muted-foreground"/>
                                    ) : (
                                        <Camera className="size-6 text-muted-foreground"/>
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
