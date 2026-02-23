"use client";

import { Cloud, Database, Globe, ShieldCheck, Heart, Building2, Code, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { CostCard } from "@/components/marketing/cost-card";
import { DonateCard } from "@/components/marketing/donate-card";
import { FeatureCard } from "@/components/marketing/feature-card";
import { SponsorTier } from "@/components/marketing/sponsor-tier";

const costIcons: LucideIcon[] = [Cloud, Database, Globe, ShieldCheck];
const pillarIcons: LucideIcon[] = [Heart, Building2, Code];

export default function CostsPage() {
  const t = useTranslations("costs");

  return (
    <>
      {/* Intro */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl text-center">
            <h2 className="text-2xl font-bold">{t("intro.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("intro.description")}</p>
          </div>
        </div>
      </section>

      {/* Cost breakdown */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("breakdown.title")}</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {([0, 1, 2, 3] as const).map((i) => (
              <CostCard
                key={i}
                icon={costIcons[i]}
                name={t(`breakdown.items.${i}.name`)}
                description={t(`breakdown.items.${i}.description`)}
                cost={t(`breakdown.items.${i}.cost`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How we keep it free */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("keepFree.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {([0, 1, 2] as const).map((i) => (
              <FeatureCard
                key={i}
                icon={pillarIcons[i]}
                title={t(`keepFree.pillars.${i}.title`)}
                description={t(`keepFree.pillars.${i}.description`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Donate */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <DonateCard
              title={t("donate.title")}
              description={t("donate.description")}
              oneTimeLabel={t("donate.oneTime")}
              monthlyLabel={t("donate.monthly")}
              ctaLabel={t("donate.cta")}
            />
          </div>
        </div>
      </section>

      {/* Sponsor tiers */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("sponsor.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {([0, 1, 2] as const).map((i) => (
              <SponsorTier
                key={i}
                name={t(`sponsor.tiers.${i}.name`)}
                price={t(`sponsor.tiers.${i}.price`)}
                description={t(`sponsor.tiers.${i}.description`)}
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href="mailto:sponsor@openhospi.nl"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Mail className="size-4" />
              {t("sponsor.cta")}
            </a>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("transparency.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("transparency.description")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
