import { SiGithub } from "@icons-pack/react-simple-icons";
import type { Locale } from "@openhospi/i18n";
import {
  BadgeCheck,
  HandCoins,
  Lock,
  LogIn,
  Scale,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { CtaSection } from "@/components/marketing/cta-section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Hero } from "@/components/marketing/hero";
import { SponsorStrip } from "@/components/marketing/sponsor-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { alternatesForPath, organizationJsonLd } from "@/lib/marketing/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo.home" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesForPath(locale, ""),
  };
}

const featureIcons = {
  free: HandCoins,
  verified: ShieldCheck,
  encrypted: Lock,
  fair: Scale,
} as const;

const stepIcons = [LogIn, Search, UserCheck] as const;

export default function HomePage() {
  const t = useTranslations("home");

  // Safe: all content from our i18n translations and constants, not user input
  const orgJsonLd = organizationJsonLd();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonLd }} />

      {/* Hero */}
      <Hero />

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {t("features.title")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(["free", "verified", "encrypted", "fair"] as const).map((key) => (
              <FeatureCard
                key={key}
                icon={featureIcons[key]}
                title={t(`features.${key}.title`)}
                description={t(`features.${key}.description`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {t("howItWorks.title")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {(["step1", "step2", "step3"] as const).map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={step} className="text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="size-7 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{t(`howItWorks.${step}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`howItWorks.${step}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Only real students */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <BadgeCheck className="mx-auto size-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("students.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("students.description")}</p>
            <Badge variant="secondary" className="mt-6">
              {t("students.badge")}
            </Badge>
          </div>
        </div>
      </section>

      {/* Open source */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <SiGithub className="mx-auto size-12" color="currentColor" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("openSource.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("openSource.description")}</p>
            <div className="mt-8">
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/OpenHospi/OpenHospi"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SiGithub className="size-4" color="currentColor" />
                  {t("openSource.cta")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners & Sponsors */}
      <SponsorStrip />

      {/* Final CTA */}
      <CtaSection />
    </>
  );
}
