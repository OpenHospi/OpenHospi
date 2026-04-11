import type { Locale } from "@openhospi/i18n";
import { Building2, Cloud, Code, ExternalLink, Globe, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CostCard } from "@/components/marketing/cost-card";
import { DonateCard } from "@/components/marketing/donate-card";
import { FeatureCard } from "@/components/marketing/feature-card";
import { SponsorStrip } from "@/components/marketing/sponsor-strip";
import { WaivedCostCard } from "@/components/marketing/waived-cost-card";
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
import { alternatesForPath, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";
import { WAIVED_SPONSORS } from "@/lib/marketing/sponsors";

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

const groupIcons: LucideIcon[] = [Cloud, Globe];
const pillarIcons: LucideIcon[] = [Heart, Building2, Code];

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

  const groups = t.raw("breakdown.groups") as { items: unknown[] }[];
  const summaryRows = t.raw("summary.rows") as unknown[];
  const pillars = t.raw("keepFree.pillars") as unknown[];
  const tiers = t.raw("donate.tiers") as unknown[];

  return (
    <>
      {/* Safe: JSON-LD from our own i18n translations, not user input */}
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
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            {groups.map((group, groupIndex) => {
              const hasCurrentAtScale = "current" in (group.items[0] as Record<string, unknown>);

              const items = group.items.map((_, j) => {
                const base = {
                  name: t(
                    `breakdown.groups.${groupIndex}.items.${j}.name` as Parameters<typeof t>[0],
                  ),
                  description: t(
                    `breakdown.groups.${groupIndex}.items.${j}.description` as Parameters<
                      typeof t
                    >[0],
                  ),
                };

                if (hasCurrentAtScale) {
                  return {
                    ...base,
                    current: t(
                      `breakdown.groups.${groupIndex}.items.${j}.current` as Parameters<
                        typeof t
                      >[0],
                    ),
                    atScale: t(
                      `breakdown.groups.${groupIndex}.items.${j}.atScale` as Parameters<
                        typeof t
                      >[0],
                    ),
                  };
                }

                return {
                  ...base,
                  cost: t(
                    `breakdown.groups.${groupIndex}.items.${j}.cost` as Parameters<typeof t>[0],
                  ),
                };
              });

              return (
                <CostCard
                  key={groupIndex}
                  icon={groupIcons[groupIndex]}
                  name={t(`breakdown.groups.${groupIndex}.name`)}
                  description={t(`breakdown.groups.${groupIndex}.description`)}
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
                {summaryRows.map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {t(`summary.rows.${i}.name` as Parameters<typeof t>[0])}
                    </TableCell>
                    <TableCell className="text-right">
                      {t(`summary.rows.${i}.current` as Parameters<typeof t>[0])}
                    </TableCell>
                    <TableCell className="text-right">
                      {t(`summary.rows.${i}.atScale` as Parameters<typeof t>[0])}
                    </TableCell>
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

      {/* Waived costs */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("waived.title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            {t("waived.subtitle")}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WAIVED_SPONSORS.map((sponsor, i) => (
              <WaivedCostCard
                key={sponsor.name}
                logoLight={sponsor.logoLight}
                logoDark={sponsor.logoDark}
                url={sponsor.url}
                name={t(`waived.items.${i}.name` as Parameters<typeof t>[0])}
                description={t(`waived.items.${i}.description` as Parameters<typeof t>[0])}
                normalCost={t(`waived.items.${i}.normalCost` as Parameters<typeof t>[0])}
                sponsor={t(`waived.items.${i}.sponsor` as Parameters<typeof t>[0])}
                badge={t("waived.badge")}
              />
            ))}
          </div>
          <p className="mt-8 text-center text-lg font-semibold text-primary">
            {t("waived.totalLabel")}: {t("waived.totalValue")}
          </p>
        </div>
      </section>

      {/* How we keep it free */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("keepFree.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {pillars.map((_, i) => (
              <FeatureCard
                key={i}
                icon={pillarIcons[i]}
                title={t(`keepFree.pillars.${i}.title` as Parameters<typeof t>[0])}
                description={t(`keepFree.pillars.${i}.description` as Parameters<typeof t>[0])}
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
            {tiers.map((_, i) => (
              <DonateCard
                key={i}
                name={t(`donate.tiers.${i}.name` as Parameters<typeof t>[0])}
                price={t(`donate.tiers.${i}.price` as Parameters<typeof t>[0])}
                badge={t(`donate.tiers.${i}.badge` as Parameters<typeof t>[0])}
                description={t(`donate.tiers.${i}.description` as Parameters<typeof t>[0])}
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild>
              <a
                href="https://opencollective.com/openhospi"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Heart className="size-4" />
                {t("donate.cta")}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Partners & Sponsors */}
      <SponsorStrip />

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
