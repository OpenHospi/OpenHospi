import type { Locale } from "@openhospi/i18n";
import { HelpCircle } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("faqPage.title"),
    description: t("faqPage.description"),
    alternates: alternatesForPath(locale, "/faq"),
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  name: string;
  items: FaqItem[];
}

export default async function FaqPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "faq" });
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });

  const categories = t.raw("categories") as FaqCategory[];
  const allFaqItems: FaqItem[] = categories.flatMap((cat) => cat.items);

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: t("title"), path: "/faq" },
  ]);

  const faqSchema = faqJsonLd(allFaqItems);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />

      {/* Hero */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <HelpCircle className="size-8 text-primary" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {categories.map((category, catIdx) => (
              <div key={catIdx}>
                <h2 className="text-xl font-bold tracking-tight">{category.name}</h2>
                <Accordion type="multiple" className="mt-4">
                  {category.items.map((item, itemIdx) => (
                    <AccordionItem key={itemIdx} value={`cat-${catIdx}-${itemIdx}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("cta.description")}</p>
          <div className="mt-8">
            <Button asChild>
              <a href="mailto:info@openhospi.nl">{t("cta.emailLabel")}</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
