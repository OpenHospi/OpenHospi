import type { Locale } from "@openhospi/i18n";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("dataProcessors.title"),
    description: t("dataProcessors.description"),
    alternates: alternatesForPath(locale, "/data-processors"),
  };
}

export default async function DataProcessorsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "dataProcessors" });
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });

  // Safe: JSON-LD from i18n translations, sanitized in seo.ts (per Next.js docs recommendation)
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: t("title"), path: "/data-processors" },
  ]);

  return (
    <section className="py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <LegalPageContent locale={locale} namespace="dataProcessors" hasIntro />
    </section>
  );
}
