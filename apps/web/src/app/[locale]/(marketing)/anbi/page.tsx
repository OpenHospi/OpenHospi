import type { Locale } from "@openhospi/i18n";
import { FileDown } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd } from "@/lib/marketing/seo";

const BELEIDSPLAN_PDF = "/documents/beleidsplan-stichting-openhospi.pdf";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("anbi.title"),
    description: t("anbi.description"),
    alternates: alternatesForPath(locale, "/anbi"),
  };
}

export default async function AnbiPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "anbi" });
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });

  // Safe: JSON-LD from i18n translations, sanitized in seo.ts (per Next.js docs recommendation)
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: t("title"), path: "/anbi" },
  ]);

  const downloadLabel = t.raw("sections.2.downloadLabel") as string;

  return (
    <section className="py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <LegalPageContent locale={locale} namespace="anbi" hasIntro />
      <div className="mx-auto mt-6 max-w-3xl px-4 sm:px-6 lg:px-8">
        <a
          href={BELEIDSPLAN_PDF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-2 hover:text-primary/80"
        >
          <FileDown className="size-4" />
          {downloadLabel}
        </a>
      </div>
    </section>
  );
}
