"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function CtaSection() {
  const t = useTranslations("home.cta");

  return (
    <section className="bg-primary/5 py-24">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-10">
          <Button size="lg" asChild>
            <Link href="/api/auth/signin">{t("button")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
