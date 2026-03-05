"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { SPONSORS } from "@/lib/sponsors";

export function SponsorStrip() {
  const t = useTranslations("sponsors");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h2>

        {SPONSORS.length === 0 ? (
          <div className="mx-auto mt-8 max-w-xl text-center">
            <p className="text-muted-foreground">{t("emptyDescription")}</p>
            <div className="mt-6">
              <Button variant="outline" asChild>
                <a
                  href="https://opencollective.com/openhospi"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Heart className="size-4" />
                  {t("emptyCta")}
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              {t("subtitle")}
            </p>
            <div className="group relative mt-12 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
              <div className="flex animate-marquee items-center gap-16 group-hover:[animation-play-state:paused]">
                {[...SPONSORS, ...SPONSORS].map((sponsor, i) => (
                  <a
                    key={`${sponsor.name}-${i}`}
                    href={sponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center"
                  >
                    <Image
                      src={sponsor.logo}
                      alt={sponsor.name}
                      width={120}
                      height={40}
                      className="h-10 w-auto grayscale transition-[filter] duration-300 hover:grayscale-0 dark:brightness-0 dark:invert dark:hover:brightness-100 dark:hover:invert-0"
                    />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
