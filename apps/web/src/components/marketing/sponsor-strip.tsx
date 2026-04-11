"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Sponsor } from "@/lib/marketing/sponsors";
import { SPONSORS } from "@/lib/marketing/sponsors";

const MARQUEE_THRESHOLD = 5;

function SponsorLogo({ name, logoLight, logoDark, url }: Sponsor) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center">
      {logoDark ? (
        <>
          <Image
            src={logoLight}
            alt={name}
            width={120}
            height={40}
            className="block h-10 w-auto dark:hidden"
          />
          <Image
            src={logoDark}
            alt={name}
            width={120}
            height={40}
            className="hidden h-10 w-auto dark:block"
          />
        </>
      ) : (
        <Image src={logoLight} alt={name} width={120} height={40} className="h-10 w-auto" />
      )}
    </a>
  );
}

export function SponsorStrip() {
  const t = useTranslations("sponsors");

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h2>

        {SPONSORS.length === 0 && (
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
        )}

        {SPONSORS.length > 0 && SPONSORS.length < MARQUEE_THRESHOLD && (
          <>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              {t("subtitle")}
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-12">
              {SPONSORS.map((sponsor) => (
                <SponsorLogo key={sponsor.name} {...sponsor} />
              ))}
            </div>
          </>
        )}

        {SPONSORS.length >= MARQUEE_THRESHOLD && (
          <>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              {t("subtitle")}
            </p>
            <div className="group relative mt-12 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent" />
              <div className="flex animate-marquee items-center gap-16 group-hover:paused">
                {[...SPONSORS, ...SPONSORS].map((sponsor, i) => (
                  <SponsorLogo key={`${sponsor.name}-${i}`} {...sponsor} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
