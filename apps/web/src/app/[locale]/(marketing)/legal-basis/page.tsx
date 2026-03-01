import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Separator } from "@/components/ui/separator";
import { alternatesForPath, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("legalBasis.title"),
    description: t("legalBasis.description"),
    alternates: alternatesForPath(locale, "/legal-basis"),
  };
}

export default async function LegalBasisPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "legalBasis" });
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });

  const sectionCount = 6;

  // Safe: JSON-LD from i18n translations, sanitized in seo.ts (per Next.js docs recommendation)
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: t("title"), path: "/legal-basis" },
  ]);

  return (
    <section className="py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>

        <Separator className="my-8" />

        <p className="mb-8 text-muted-foreground leading-relaxed">{t("intro")}</p>

        <div className="space-y-8">
          {Array.from({ length: sectionCount }, (_, i) => (
            <article key={i}>
              <h2 className="text-xl font-semibold">{t(`sections.${i}.title`)}</h2>
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
