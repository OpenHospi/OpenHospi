import type { Locale } from "@openhospi/i18n";
import { Building2, Cloud, Code, ExternalLink, Globe, Heart, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CostCard } from "@/components/marketing/cost-card";
import { DonateCard } from "@/components/marketing/donate-card";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("costs.title"),
    description: t("costs.description"),
    alternates: alternatesForPath(locale, "/costs"),
  };
}

const groupIcons: LucideIcon[] = [Cloud, Globe, Smartphone];
const groupItemCounts = [3, 3, 2] as const;
const pillarIcons: LucideIcon[] = [Heart, Building2, Code];

const infrastructureGroupIndex = 0;

export default async function CostsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "costs" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("breadcrumbs.home"), path: "" },
    { name: t("title"), path: "/costs" },
  ]);

  const faqItems = tSeo.raw("faq.costs") as { question: string; answer: string }[];
  const faq = faqJsonLd(faqItems);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} />

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
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {([0, 1, 2] as const).map((groupIndex) => {
              const items = Array.from({ length: groupItemCounts[groupIndex] }, (_, j) => {
                const base = {
                  name: t(`breakdown.groups.${groupIndex}.items.${j}.name` as any),
                  description: t(`breakdown.groups.${groupIndex}.items.${j}.description` as any),
                };

                if (groupIndex === infrastructureGroupIndex) {
                  return {
                    ...base,
                    current: t(`breakdown.groups.${groupIndex}.items.${j}.current` as any),
                    atScale: t(`breakdown.groups.${groupIndex}.items.${j}.atScale` as any),
                  };
                }

                return {
                  ...base,
                  cost: t(`breakdown.groups.${groupIndex}.items.${j}.cost` as any),
                };
              });

              return (
                <CostCard
                  key={groupIndex}
                  icon={groupIcons[groupIndex]}
                  name={t(`breakdown.groups.${groupIndex}.name` as any)}
                  description={t(`breakdown.groups.${groupIndex}.description` as any)}
                  items={items}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Summary table */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("summary.title")}</h2>
          <div className="mx-auto mt-12 max-w-2xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">&nbsp;</TableHead>
                  <TableHead className="text-right">
                    {t("summary.currentLabel")}
                    <span className="text-muted-foreground"> {t("summary.perYear")}</span>
                  </TableHead>
                  <TableHead className="text-right">
                    {t("summary.atScaleLabel")}
                    <span className="text-muted-foreground"> {t("summary.perYear")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {([0, 1, 2, 3, 4, 5] as const).map((i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{t(`summary.rows.${i}.name` as any)}</TableCell>
                    <TableCell className="text-right">{t(`summary.rows.${i}.current` as any)}</TableCell>
                    <TableCell className="text-right">{t(`summary.rows.${i}.atScale` as any)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>{t("summary.totalLabel")}</TableCell>
                  <TableCell className="text-right text-primary">
                    {t("summary.currentTotal")}
                  </TableCell>
                  <TableCell className="text-right text-primary">
                    {t("summary.atScaleTotal")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* How we keep it free */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("keepFree.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {([0, 1, 2] as const).map((i) => (
              <FeatureCard
                key={i}
                icon={pillarIcons[i]}
                title={t(`keepFree.pillars.${i}.title` as any)}
                description={t(`keepFree.pillars.${i}.description` as any)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Donate & Sponsor */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("donate.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {([0, 1, 2] as const).map((i) => (
              <DonateCard
                key={i}
                name={t(`donate.tiers.${i}.name` as any)}
                price={t(`donate.tiers.${i}.price` as any)}
                badge={t(`donate.tiers.${i}.badge` as any)}
                description={t(`donate.tiers.${i}.description` as any)}
                ctaLabel={t("donate.cta")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("transparency.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("transparency.description")}</p>
            <Button variant="outline" asChild className="mt-6">
              <a
                href="https://opencollective.com/openhospi"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                {t("transparency.badge")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
