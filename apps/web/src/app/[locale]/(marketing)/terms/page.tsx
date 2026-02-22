"use client";

import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  const t = useTranslations("terms");

  const sectionCount = 6;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated")}
        </p>

        <Separator className="my-8" />

        <div className="space-y-8">
          {Array.from({ length: sectionCount }, (_, i) => (
            <article key={i}>
              <h2 className="text-xl font-semibold">
                {t(`sections.${i}.title`)}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {t(`sections.${i}.content`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
