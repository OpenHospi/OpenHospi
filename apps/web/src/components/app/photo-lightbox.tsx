"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { StorageImage } from "@/components/storage-image";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type Photo = {
  id: string;
  url: string;
  caption?: string | null;
};

type Props = {
  photos: Photo[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket?: "room-photos" | "profile-photos";
};

export function PhotoLightbox({
  photos,
  initialIndex,
  open,
  onOpenChange,
  bucket = "room-photos",
}: Props) {
  const t = useTranslations("common.gallery");
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

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

  useEffect(() => {
    if (!api || !open) return;
    api.scrollTo(initialIndex, true);
  }, [api, initialIndex, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 rounded-none border-none bg-black/95 p-0"
        style={{
          position: "fixed",
          inset: 0,
          width: "100dvw",
          height: "100dvh",
          maxWidth: "none",
          maxHeight: "none",
          transform: "none",
          translate: "none",
        }}
      >
        <DialogTitle className="sr-only">{t("lightboxTitle")}</DialogTitle>

        <DialogClose className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20">
          <X className="size-5" />
          <span className="sr-only">{t("close")}</span>
        </DialogClose>

        <div className="flex h-full flex-col items-center justify-center">
          <Carousel
            opts={{ startIndex: initialIndex, loop: true }}
            setApi={setApi}
            className="w-full max-w-5xl px-14"
          >
            <CarouselContent className="-ml-0">
              {photos.map((photo) => (
                <CarouselItem key={photo.id} className="pl-0">
                  <div className="relative h-[80dvh] w-full">
                    <StorageImage
                      src={photo.url}
                      alt={photo.caption ?? t("lightboxTitle")}
                      bucket={bucket}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {photos.length > 1 && (
              <>
                <CarouselPrevious
                  className="left-0 size-10 border-none bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-label={t("previous")}
                />
                <CarouselNext
                  className="right-0 size-10 border-none bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-label={t("next")}
                />
              </>
            )}
          </Carousel>

          {photos.length > 1 && (
            <p className="mt-4 text-sm text-white/70">
              {t("counter", {
                current: selectedIndex + 1,
                total: photos.length,
              })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
