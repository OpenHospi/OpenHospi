"use client";

import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PhotoLightbox } from "@/components/app/photo-lightbox";
import { StorageImage } from "@/components/storage-image";
import { cn } from "@/lib/utils";

type Photo = {
  id: string;
  slot: number;
  url: string;
  caption: string | null;
};

type Props = {
  photos: Photo[];
  roomTitle: string;
  bucket?: "room-photos" | "profile-photos";
};

export function RoomGalleryHero({ photos, roomTitle, bucket = "room-photos" }: Props) {
  const t = useTranslations("app.roomDetail");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  const count = photos.length;

  // Single photo
  if (count === 1) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => openLightbox(0)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openLightbox(0);
          }}
          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-muted"
        >
          <StorageImage
            src={photos[0].url}
            alt={roomTitle}
            bucket={bucket}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {photos[0].caption && (
            <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs text-white">
              {photos[0].caption}
            </span>
          )}
        </div>
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          bucket={bucket}
        />
      </>
    );
  }

  // 2 photos: side by side
  if (count === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              role="button"
              tabIndex={0}
              onClick={() => openLightbox(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openLightbox(i);
              }}
              className="relative aspect-video cursor-pointer bg-muted transition-[filter] hover:brightness-90"
            >
              <StorageImage
                src={photo.url}
                alt={`${roomTitle} — ${i + 1}`}
                bucket={bucket}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="50vw"
              />
              {photo.caption && (
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs text-white">
                  {photo.caption}
                </span>
              )}
            </div>
          ))}
        </div>
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          bucket={bucket}
        />
      </>
    );
  }

  // 3+ photos: large cover + thumbnail row below
  const thumbnails = photos.slice(1, 5);

  return (
    <>
      {/* Mobile: cover only */}
      <div className="relative md:hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => openLightbox(0)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openLightbox(0);
          }}
          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-muted"
        >
          <StorageImage
            src={photos[0].url}
            alt={roomTitle}
            bucket={bucket}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {photos[0].caption && (
            <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs text-white">
              {photos[0].caption}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-md"
        >
          <Camera className="size-4" />
          {t("showAllPhotos", { count: String(String(count)) })}
        </button>
      </div>

      {/* Desktop: cover + thumbnail row */}
      <div className="hidden md:block">
        <div className="relative grid grid-cols-4 grid-rows-2 gap-1 overflow-hidden rounded-xl">
          {/* Main photo — spans left half */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openLightbox(0)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openLightbox(0);
            }}
            className="relative col-span-2 row-span-2 aspect-[4/3] cursor-pointer bg-muted transition-[filter] hover:brightness-90"
          >
            <StorageImage
              src={photos[0].url}
              alt={roomTitle}
              bucket={bucket}
              fill
              className="object-cover"
              priority
              sizes="50vw"
            />
            {photos[0].caption && (
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs text-white">
                {photos[0].caption}
              </span>
            )}
          </div>

          {/* Thumbnails — right half, 2x2 grid */}
          {thumbnails.map((photo, i) => (
            <div
              key={photo.id}
              role="button"
              tabIndex={0}
              onClick={() => openLightbox(i + 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openLightbox(i + 1);
              }}
              className={cn(
                "relative cursor-pointer bg-muted transition-[filter] hover:brightness-90",
                "aspect-[4/3]",
              )}
            >
              <StorageImage
                src={photo.url}
                alt={`${roomTitle} — ${i + 2}`}
                bucket={bucket}
                fill
                className="object-cover"
                sizes="25vw"
              />
              {photo.caption && (
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-xs text-white">
                  {photo.caption}
                </span>
              )}
            </div>
          ))}

          {/* Show all photos button */}
          {count > 5 && (
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-md"
            >
              <Camera className="size-4" />
              {t("showAllPhotos", { count: String(String(count)) })}
            </button>
          )}
        </div>
      </div>

      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        bucket={bucket}
      />
    </>
  );
}
