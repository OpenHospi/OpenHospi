import type { Locale } from "@openhospi/i18n";
import {
  HandCoins,
  LogIn,
  Mail,
  MessageCircle,
  PartyPopper,
  Scale,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FeatureCard } from "@/components/marketing/feature-card";
import { StepList } from "@/components/marketing/step-list";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
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
    title: t("findARoom.title"),
    description: t("findARoom.description"),
    alternates: alternatesForPath(locale, "/find-a-room"),
  };
}

const whyIcons = [ShieldCheck, HandCoins, MessageCircle, Scale] as const;
const stepIcons: LucideIcon[] = [LogIn, UserPlus, Search, Mail, Users, PartyPopper];

export default async function FindARoomPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "findRoom" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const loginUrl = getLoginUrl();

  const steps = ([0, 1, 2, 3, 4, 5] as const).map((i) => ({
    title: t(`steps.items.${i}.title`),
    description: t(`steps.items.${i}.description`),
  }));

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("breadcrumbs.home"), path: "" },
    { name: t("title"), path: "/find-a-room" },
  ]);

  const faqItems = tSeo.raw("faq.findARoom") as { question: string; answer: string }[];
  const faq = faqJsonLd(faqItems);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} />

      {/* Hero */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("why.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {([0, 1, 2, 3] as const).map((i) => (
              <FeatureCard
                key={i}
                icon={whyIcons[i]}
                title={t(`why.items.${i}.title`)}
                description={t(`why.items.${i}.description`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Steps section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">{t("steps.title")}</h2>
          <StepList steps={steps} icons={stepIcons} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("cta.title")}</h2>
          <div className="mt-8">
            <Button size="lg" asChild>
              <a href={loginUrl}>{t("cta.button")}</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
