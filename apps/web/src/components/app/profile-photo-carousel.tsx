"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { PhotoLightbox } from "@/components/app/photo-lightbox";
import { StorageImage } from "@/components/storage-image";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type Photo = {
  id: string;
  url: string;
  caption?: string | null;
};

type Props = {
  photos: Photo[];
  userName: string;
};

export function ProfilePhotoCarousel({ photos, userName }: Props) {
  const t = useTranslations("common.gallery");
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  // Single photo — no carousel
  if (photos.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted"
        >
          <StorageImage
            src={photos[0].url}
            alt={userName}
            bucket="profile-photos"
            fill
            className="object-cover"
          />
        </button>
        <PhotoLightbox
          photos={photos}
          initialIndex={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          bucket="profile-photos"
        />
      </>
    );
  }

  return (
    <>
      <div>
        <Carousel opts={{ loop: true }} setApi={setApi}>
          <div className="relative">
            <CarouselContent className="-ml-0">
              {photos.map((photo, index) => (
                <CarouselItem key={photo.id} className="pl-0">
                  <button
                    type="button"
                    onClick={() => openLightbox(index)}
                    className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted"
                  >
                    <StorageImage
                      src={photo.url}
                      alt={photo.caption ?? userName}
                      bucket="profile-photos"
                      fill
                      className="object-cover"
                    />
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              className="left-2 top-1/2 size-8 border-none bg-black/40 text-white hover:bg-black/60 hover:text-white"
              aria-label={t("previous")}
            />
            <CarouselNext
              className="right-2 top-1/2 size-8 border-none bg-black/40 text-white hover:bg-black/60 hover:text-white"
              aria-label={t("next")}
            />
          </div>
        </Carousel>

        {/* Dot indicators */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={cn(
                "size-2 rounded-full transition-colors",
                index === selectedIndex ? "bg-primary" : "bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </div>

      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        bucket="profile-photos"
      />
    </>
  );
}
