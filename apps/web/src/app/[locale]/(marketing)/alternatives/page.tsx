import type { Locale } from "@openhospi/i18n";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd } from "@/lib/marketing/seo";
import { getLoginUrl } from "@/lib/urls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("alternatives.title"),
    description: t("alternatives.description"),
    alternates: alternatesForPath(locale, "/alternatives"),
  };
}

type Tone = "positive" | "warning" | "negative" | "neutral";

interface CellData {
  label: string;
  tone: Tone;
}

interface TableRowData {
  feature: string;
  openhospi: CellData;
  hospi: CellData;
  myhospi: CellData;
  dingdong: CellData;
  kamernet: CellData;
  facebook: CellData;
}

interface PlatformItem {
  name: string;
  type: string;
  url: string;
  pricing: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string;
}

const platformKeys = ["openhospi", "hospi", "myhospi", "dingdong", "kamernet", "facebook"] as const;

const toneClasses: Record<Tone, string> = {
  positive:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  negative:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  neutral:
    "border-muted-foreground/20 bg-muted/50 text-muted-foreground dark:border-muted-foreground/20 dark:bg-muted/50",
};

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "alternatives" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("breadcrumbs.home"), path: "" },
    { name: tSeo("breadcrumbs.alternatives"), path: "/alternatives" },
  ]);

  const tableRows = t.raw("table.rows") as TableRowData[];
  const columnHeaders = t.raw("table.columns") as string[];
  const platforms = t.raw("platforms.items") as PlatformItem[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />

      {/* Hero */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
            <p className="mt-4 text-sm text-muted-foreground">{t("disclaimer")}</p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("table.title")}</h2>
          <div className="relative mt-12 overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnHeaders.map((header, i) => (
                    <TableHead
                      key={header}
                      className={
                        i === 0
                          ? "bg-muted/80 sticky left-0 z-10 min-w-28 backdrop-blur-sm after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border"
                          : "min-w-28 text-center"
                      }
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="bg-muted/50 sticky left-0 z-10 font-medium backdrop-blur-sm after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border">
                      {row.feature}
                    </TableCell>
                    {platformKeys.map((key) => {
                      const cell = row[key];
                      return (
                        <TableCell key={key} className="text-center">
                          <Badge variant="outline" className={`text-xs ${toneClasses[cell.tone]}`}>
                            {cell.label}
                          </Badge>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("platforms.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => (
              <Card key={platform.name}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{platform.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {platform.type}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-primary">{platform.pricing}</p>
                  {platform.url !== "#" && (
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {platform.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {t("platforms.strengthsLabel")}
                    </h4>
                    <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                      {platform.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {t("platforms.weaknessesLabel")}
                    </h4>
                    <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                      {platform.weaknesses.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{t("platforms.bestForLabel")}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{platform.bestFor}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Honesty Statement */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("honesty.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("honesty.description")}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("cta.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("cta.subtitle")}</p>
            <Button asChild className="mt-6">
              <a href={getLoginUrl()}>{t("cta.button")}</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
