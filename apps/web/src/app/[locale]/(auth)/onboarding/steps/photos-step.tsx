"use client";

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {rectSortingStrategy, SortableContext, useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {
    ALLOWED_IMAGE_TYPES,
    MAX_AVATAR_SIZE,
    MAX_PROFILE_PHOTOS,
} from "@openhospi/shared/constants";
import {Camera, GripVertical, Loader2, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useRef, useState, useTransition} from "react";
import {toast} from "sonner";

import {
    deleteProfilePhoto,
    reorderProfilePhotos,
    saveProfilePhoto,
} from "@/app/[locale]/(app)/profile/profile-actions";
import {StorageImage} from "@/components/storage-image";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import type {ProfilePhoto} from "@/lib/profile";
import {cn} from "@/lib/utils";

type Props = {
    photos: ProfilePhoto[];
    onPhotosChange: (photos: ProfilePhoto[]) => void;
    onBack: () => void;
    onNext: () => void;
};

type SlotItem = {
    id: string;
    slot: number;
    photo: ProfilePhoto | undefined;
};

function SortableSlot({
                          item,
                          isUploading,
                          isPending,
                          onUploadClick,
                          onDelete,
                          t,
                      }: {
    item: SlotItem;
    isUploading: boolean;
    isPending: boolean;
    onUploadClick: (slot: number) => void;
    onDelete: (slot: number) => void;
    t: ReturnType<typeof useTranslations>;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: item.id,
        disabled: !item.photo,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const {photo, slot} = item;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2",
                photo ? "border-solid border-muted" : "border-dashed",
                slot === 1 && !photo && "border-primary",
                isDragging && "opacity-40",
            )}
        >
            {photo ? (
                <>
                    <StorageImage
                        src={photo.url}
                        alt={t(`photoSlots.slot${slot}` as Parameters<typeof t>[0])}
                        bucket="profile-photos"
                        fill
                        className="object-cover"
                    />
                    {/* Gradient overlay with label */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                        {slot === 1 && <Badge className="mb-1">{t("required")}</Badge>}
                        <p className="text-xs font-medium text-white">{t(`photoSlots.slot${slot}` as Parameters<typeof t>[0])}</p>
                    </div>
                    {/* Grip handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        aria-label={t("dragToReorder")}
                        className="absolute top-1 left-1 cursor-grab rounded-full bg-black/60 p-1 text-white opacity-100 hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100 active:cursor-grabbing"
                    >
                        <GripVertical className="size-4"/>
                    </button>
                    {/* Delete button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(slot)}
                        className="absolute top-1 right-1 size-auto rounded-full bg-black/60 p-1 text-white hover:bg-black/80 hover:text-white"
                        disabled={isPending}
                    >
                        <X className="size-4"/>
                    </Button>
                </>
            ) : (
                <Button
                    variant="ghost"
                    onClick={() => onUploadClick(slot)}
                    disabled={isUploading || isPending}
                    className="size-full flex-col gap-1 p-2 hover:bg-muted/50"
                >
                    {isUploading ? (
                        <Loader2 className="size-6 animate-spin text-muted-foreground"/>
                    ) : (
                        <Camera className="size-6 text-muted-foreground"/>
                    )}
                    <span className="text-xs text-muted-foreground">{t(`photoSlots.slot${slot}` as Parameters<typeof t>[0])}</span>
                    {slot === 1 && <span className="text-xs font-medium text-primary">{t("required")}</span>}
                </Button>
            )}
        </div>
    );
}

export function PhotosStep({photos, onPhotosChange, onBack, onNext}: Props) {
    const t = useTranslations("app.onboarding");
    const tCommon = useTranslations("common.labels");
    const tErrors = useTranslations("common.errors");
    const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [dragActiveId, setDragActiveId] = useState<string | null>(null);

    const slots = Array.from({length: MAX_PROFILE_PHOTOS}, (_, i) => i + 1);
    const hasRequiredPhoto = photos.some((p) => p.slot === 1);

    const items: SlotItem[] = slots.map((slot) => ({
        id: `slot-${slot}`,
        slot,
        photo: photos.find((p) => p.slot === slot),
    }));

    const draggedItem = items.find((item) => item.id === dragActiveId);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}}),
        useSensor(TouchSensor, {activationConstraint: {delay: 200, tolerance: 5}}),
    );

    function handleUploadClick(slot: number) {
        setActiveSlot(slot);
        fileInputRef.current?.click();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || activeSlot === null) return;

        if (file.size > MAX_AVATAR_SIZE) {
            toast.error(tErrors("fileTooLarge", {maxSize: String(Math.round(MAX_AVATAR_SIZE / 1024 / 1024))}));
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

    function handleDragStart(event: DragStartEvent) {
        setDragActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        setDragActiveId(null);
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const activeIndex = items.findIndex((item) => item.id === active.id);
        const overIndex = items.findIndex((item) => item.id === over.id);
        const activeItem = items[activeIndex];
        const overItem = items[overIndex];

        if (!activeItem?.photo) return;

        // Build new photos array with swapped slots
        const newPhotos = photos.map((p) => {
            if (p.id === activeItem.photo!.id) return {...p, slot: overItem.slot};
            if (overItem.photo && p.id === overItem.photo.id) return {...p, slot: activeItem.slot};
            return p;
        });

        // Optimistic update
        onPhotosChange(newPhotos);

        // Build swaps for server
        const swaps: { photoId: string; newSlot: number }[] = [
            {photoId: activeItem.photo.id, newSlot: overItem.slot},
        ];
        if (overItem.photo) {
            swaps.push({photoId: overItem.photo.id, newSlot: activeItem.slot});
        }

        startTransition(async () => {
            const result = await reorderProfilePhotos(swaps);
            if (result.error) {
                toast.error(result.error);
                // Rollback
                onPhotosChange(photos);
            }
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

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {items.map((item) => (
                            <div key={item.id} className="group">
                                <SortableSlot
                                    item={item}
                                    isUploading={uploadingSlot === item.slot}
                                    isPending={isPending}
                                    onUploadClick={handleUploadClick}
                                    onDelete={handleDelete}
                                    t={t}
                                />
                            </div>
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay>
                    {draggedItem?.photo ? (
                        <div className="aspect-square overflow-hidden rounded-lg border-2 border-primary shadow-xl">
                            <StorageImage
                                src={draggedItem.photo.url}
                                alt=""
                                bucket="profile-photos"
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    {tCommon("back")}
                </Button>
                <Button onClick={onNext} disabled={!hasRequiredPhoto || isPending}>
                    {tCommon("next")}
                </Button>
            </div>
        </div>
    );
}
