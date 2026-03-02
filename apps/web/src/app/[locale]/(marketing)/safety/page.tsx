import type { Locale } from "@openhospi/i18n";
import { Code, EyeOff, Flag, Lock, Scale, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
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
    title: t("safety.title"),
    description: t("safety.description"),
    alternates: alternatesForPath(locale, "/safety"),
  };
}

const icons: LucideIcon[] = [ShieldCheck, Lock, EyeOff, Scale, Code, Flag];

export default async function SafetyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "safety" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("breadcrumbs.home"), path: "" },
    { name: t("title"), path: "/safety" },
  ]);

  const faqItems = tSeo.raw("faq.safety") as { question: string; answer: string }[];
  const faq = faqJsonLd(faqItems);

  return (
    <section className="py-24">
      {/* Safe: JSON-LD from i18n translations, sanitized in seo.ts (per Next.js docs recommendation) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {([0, 1, 2, 3, 4, 5] as const).map((i) => {
            const Icon = icons[i];
            return (
              <Card key={i} className="border-0 bg-muted/50 shadow-none">
                <CardContent className="pt-6">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{t(`features.${i}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`features.${i}.description`)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
