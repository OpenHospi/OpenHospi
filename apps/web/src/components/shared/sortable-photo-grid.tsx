"use client";

import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/react";
import { ALLOWED_IMAGE_TYPES, MAX_PHOTO_CAPTION_LENGTH } from "@openhospi/shared/constants";
import type { StorageBucket } from "@openhospi/shared/constants";
import { Camera, GripVertical, Loader2, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { StorageImage } from "@/components/shared/storage-image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type SortablePhoto = {
  id: string;
  slot: number;
  url: string;
  caption?: string | null;
};

type SlotItem = {
  id: string;
  slot: number;
  photo: SortablePhoto | undefined;
};

export type SortablePhotoGridProps = {
  photos: SortablePhoto[];
  slots: number[];
  bucket: StorageBucket;
  maxFileSize: number;
  editable?: boolean;
  getSlotLabel: (slot: number) => string;
  dragLabel: string;
  onUpload: (slot: number, file: File) => Promise<SortablePhoto | null>;
  onDelete: (slot: number) => Promise<boolean>;
  onReorder: (swaps: { photoId: string; newSlot: number }[]) => Promise<boolean>;
  onPhotosChange?: (photos: SortablePhoto[]) => void;
  onCaptionSave?: (slot: number, caption: string | null) => Promise<boolean>;
  captionPlaceholder?: string;
  renderPhotoOverlay?: (photo: SortablePhoto, slot: number) => React.ReactNode;
  renderEmptyExtra?: (slot: number) => React.ReactNode;
  gridClassName?: string;
  getSlotClassName?: (slot: number) => string;
  highlightEmptySlot?: number;
};

function CaptionPopover({
  photo,
  captionPlaceholder,
  onSave,
}: {
  photo: SortablePhoto;
  captionPlaceholder: string;
  onSave: (caption: string | null) => Promise<boolean>;
}) {
  const t = useTranslations("app.rooms.captions");
  const tCommon = useTranslations("common.labels");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(photo.caption ?? "");
  const [saving, setSaving] = useState(false);

  function handleOpen(isOpen: boolean) {
    if (isOpen) setValue(photo.caption ?? "");
    setOpen(isOpen);
  }

  async function handleSave() {
    setSaving(true);
    const caption = value.trim() || null;
    const ok = await onSave(caption);
    setSaving(false);
    if (ok) {
      toast.success(t("saved"));
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute bottom-1 left-1 rounded-full bg-black/60 p-1 text-white opacity-100 hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 space-y-2"
        side="top"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <Textarea
          rows={2}
          maxLength={MAX_PHOTO_CAPTION_LENGTH}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={captionPlaceholder}
          className="resize-none text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t("charCount", {
              count: String(value.length),
              max: String(MAX_PHOTO_CAPTION_LENGTH),
            })}
          </span>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {tCommon("save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PhotoSlot({
  item,
  bucket,
  editable,
  isUploading,
  isPending,
  onUploadClick,
  onDelete,
  dragLabel,
  getSlotLabel,
  getSlotClassName,
  highlightEmptySlot,
  onCaptionSave,
  captionPlaceholder,
  renderPhotoOverlay,
  renderEmptyExtra,
}: {
  item: SlotItem;
  bucket: StorageBucket;
  editable: boolean;
  isUploading: boolean;
  isPending: boolean;
  onUploadClick: (slot: number) => void;
  onDelete: (slot: number) => void;
  dragLabel: string;
  getSlotLabel: (slot: number) => string;
  getSlotClassName?: (slot: number) => string;
  highlightEmptySlot?: number;
  onCaptionSave?: (slot: number, caption: string | null) => Promise<boolean>;
  captionPlaceholder?: string;
  renderPhotoOverlay?: (photo: SortablePhoto, slot: number) => React.ReactNode;
  renderEmptyExtra?: (slot: number) => React.ReactNode;
}) {
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: item.id,
    disabled: !editable,
  });

  const {
    ref: draggableRef,
    handleRef,
    isDragging,
  } = useDraggable({
    id: item.id,
    disabled: !editable || !item.photo,
  });

  const { photo, slot } = item;
  const slotClass = getSlotClassName?.(slot);

  return (
    <div
      ref={(node) => {
        droppableRef(node);
        draggableRef(node);
      }}
      className={cn(
        "relative overflow-hidden rounded-lg border-2",
        !slotClass && "aspect-square",
        photo ? "border-solid border-muted" : "border-dashed",
        editable && !photo && "cursor-pointer hover:bg-muted/50",
        !photo && highlightEmptySlot === slot && "border-primary",
        isDragging && "opacity-40",
        isDropTarget && !isDragging && "ring-2 ring-primary/50",
        slotClass,
      )}
    >
      {photo ? (
        <>
          <StorageImage
            src={photo.url}
            alt={getSlotLabel(slot)}
            bucket={bucket}
            fill
            className="object-cover"
          />
          {renderPhotoOverlay?.(photo, slot)}
          {editable && (
            <>
              {/* Grip handle */}
              <button
                ref={handleRef}
                type="button"
                aria-label={dragLabel}
                className="absolute top-1 left-1 cursor-grab rounded-full bg-black/60 p-1 text-white opacity-100 hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100 active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </button>
              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(slot)}
                className="absolute top-1 right-1 size-auto rounded-full bg-black/60 p-1 text-white hover:bg-black/80 hover:text-white"
                disabled={isPending}
              >
                <X className="size-4" />
              </Button>
              {/* Caption edit */}
              {onCaptionSave && captionPlaceholder && (
                <CaptionPopover
                  photo={photo}
                  captionPlaceholder={captionPlaceholder}
                  onSave={(caption) => onCaptionSave(slot, caption)}
                />
              )}
            </>
          )}
        </>
      ) : (
        <Button
          variant="ghost"
          onClick={() => onUploadClick(slot)}
          disabled={!editable || isUploading || isPending}
          className="size-full flex-col gap-1 p-2"
        >
          {isUploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <Camera className="size-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">{getSlotLabel(slot)}</span>
          {renderEmptyExtra?.(slot)}
        </Button>
      )}
    </div>
  );
}

export function SortablePhotoGrid({
  photos: externalPhotos,
  slots,
  bucket,
  maxFileSize,
  editable = true,
  getSlotLabel,
  dragLabel,
  onUpload,
  onDelete,
  onReorder,
  onPhotosChange,
  onCaptionSave,
  captionPlaceholder,
  renderPhotoOverlay,
  renderEmptyExtra,
  gridClassName = "grid-cols-2 gap-3 sm:grid-cols-3",
  getSlotClassName,
  highlightEmptySlot,
}: SortablePhotoGridProps) {
  const tErrors = useTranslations("common.errors");
  const [photos, setPhotosState] = useState(externalPhotos);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  function setPhotos(newPhotos: SortablePhoto[] | ((prev: SortablePhoto[]) => SortablePhoto[])) {
    const resolved = typeof newPhotos === "function" ? newPhotos(photos) : newPhotos;
    setPhotosState(resolved);
    onPhotosChange?.(resolved);
  }

  // Sync external photos when they change (e.g. after server revalidation)
  useEffect(() => {
    setPhotosState(externalPhotos);
  }, [externalPhotos]);

  const items: SlotItem[] = slots.map((slot) => ({
    id: `slot-${slot}`,
    slot,
    photo: photos.find((p) => p.slot === slot),
  }));

  async function performUpload(slot: number, file: File) {
    try {
      const photo = await onUpload(slot, file);
      setUploadingSlot(null);
      if (photo) {
        setPhotos((prev) => [...prev.filter((p) => p.slot !== slot), photo]);
      }
    } catch {
      setUploadingSlot(null);
      toast.error(tErrors("uploadFailed"));
    }
  }

  function handleUploadClick(slot: number) {
    if (!editable) return;
    setActiveSlot(slot);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;

    if (file.size > maxFileSize) {
      toast.error(
        tErrors("fileTooLarge", { maxSize: String(Math.round(maxFileSize / 1024 / 1024)) }),
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
    const ok = await onDelete(slot);
    if (ok) {
      setPhotos((prev) => prev.filter((p) => p.slot !== slot));
    }
  }

  function handleDelete(slot: number) {
    startTransition(() => performDelete(slot));
  }

  function handleDragEnd(
    event: Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>["onDragEnd"]>>[0],
  ) {
    if (event.canceled) return;
    const { source, target } = event.operation;
    if (!target || !source || source.id === target.id) return;

    const activeItem = items.find((item) => item.id === source.id);
    const overItem = items.find((item) => item.id === target.id);

    if (!activeItem?.photo || !overItem) return;

    const previousPhotos = photos;
    const newPhotos = photos.map((p) => {
      if (p.id === activeItem.photo!.id) return { ...p, slot: overItem.slot };
      if (overItem.photo && p.id === overItem.photo.id) return { ...p, slot: activeItem.slot };
      return p;
    });

    setPhotos(newPhotos);

    const swaps: { photoId: string; newSlot: number }[] = [
      { photoId: activeItem.photo.id, newSlot: overItem.slot },
    ];
    if (overItem.photo) {
      swaps.push({ photoId: overItem.photo.id, newSlot: activeItem.slot });
    }

    startTransition(async () => {
      const ok = await onReorder(swaps);
      if (!ok) {
        setPhotos(previousPhotos);
      }
    });
  }

  const grid = (
    <div className={cn("grid", gridClassName)}>
      {items.map((item) => (
        <div key={item.id} className="group">
          <PhotoSlot
            item={item}
            bucket={bucket}
            editable={editable}
            isUploading={uploadingSlot === item.slot}
            isPending={isPending}
            onUploadClick={handleUploadClick}
            onDelete={handleDelete}
            dragLabel={dragLabel}
            getSlotLabel={getSlotLabel}
            getSlotClassName={getSlotClassName}
            highlightEmptySlot={highlightEmptySlot}
            onCaptionSave={onCaptionSave}
            captionPlaceholder={captionPlaceholder}
            renderPhotoOverlay={renderPhotoOverlay}
            renderEmptyExtra={renderEmptyExtra}
          />
        </div>
      ))}
    </div>
  );

  if (!editable) {
    return <div>{grid}</div>;
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

      <DragDropProvider onDragEnd={handleDragEnd}>
        {grid}
        <DragOverlay>
          {(source) => {
            const item = items.find((i) => i.id === source.id);
            if (!item?.photo) return null;
            return (
              <div
                className={cn(
                  "overflow-hidden rounded-lg border-2 border-primary shadow-xl",
                  getSlotClassName?.(item.slot) ?? "aspect-square",
                )}
              >
                <StorageImage
                  src={item.photo.url}
                  alt=""
                  bucket={bucket}
                  fill
                  className="object-cover"
                />
              </div>
            );
          }}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}
