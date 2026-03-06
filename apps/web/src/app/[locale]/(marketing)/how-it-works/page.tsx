import type { Locale } from "@openhospi/i18n";
import {
  ClipboardList,
  Eye,
  HandCoins,
  Home,
  Link2,
  LogIn,
  Mail,
  MessageCircle,
  PartyPopper,
  Scale,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routing } from "@/i18n/routing";
import { alternatesForPath, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";
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
    title: t("howItWorks.title"),
    description: t("howItWorks.description"),
    alternates: alternatesForPath(locale, "/how-it-works"),
  };
}

const seekerWhyIcons = [ShieldCheck, HandCoins, MessageCircle, Scale] as const;
const seekerStepIcons: LucideIcon[] = [LogIn, UserPlus, Search, Mail, Users, PartyPopper];

const listerWhyIcons = [ShieldCheck, HandCoins, ClipboardList, Link2] as const;
const listerStepIcons: LucideIcon[] = [LogIn, Home, Share2, Eye, ClipboardList, Sparkles];

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "howItWorks" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const loginUrl = getLoginUrl();

  const seekerSteps = ([0, 1, 2, 3, 4, 5] as const).map((i) => ({
    title: t(`seekers.steps.items.${i}.title`),
    description: t(`seekers.steps.items.${i}.description`),
  }));

  const listerSteps = ([0, 1, 2, 3, 4, 5] as const).map((i) => ({
    title: t(`listers.steps.items.${i}.title`),
    description: t(`listers.steps.items.${i}.description`),
  }));

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("breadcrumbs.home"), path: "" },
    { name: t("title"), path: "/how-it-works" },
  ]);

  const faqItems = tSeo.raw("faq.howItWorks") as { question: string; answer: string }[];
  const faq = faqJsonLd(faqItems);

  return (
    <>
      {/* Safe: JSON-LD from i18n translations, sanitized in seo.ts (per Next.js docs recommendation) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} />

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>

          <Tabs defaultValue="seekers" className="mt-16">
            <TabsList className="mx-auto w-full max-w-md">
              <TabsTrigger value="seekers" className="flex-1">
                {t("seekers.title")}
              </TabsTrigger>
              <TabsTrigger value="listers" className="flex-1">
                {t("listers.title")}
              </TabsTrigger>
            </TabsList>

            {/* Seekers tab */}
            <TabsContent value="seekers">
              <h2 className="mt-12 text-center text-2xl font-bold sm:text-3xl">
                {t("seekers.why.title")}
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {([0, 1, 2, 3] as const).map((i) => (
                  <FeatureCard
                    key={i}
                    icon={seekerWhyIcons[i]}
                    title={t(`seekers.why.items.${i}.title`)}
                    description={t(`seekers.why.items.${i}.description`)}
                  />
                ))}
              </div>

              <h2 className="mt-16 mb-12 text-center text-2xl font-bold sm:text-3xl">
                {t("seekers.steps.title")}
              </h2>
              <StepList steps={seekerSteps} icons={seekerStepIcons} />
            </TabsContent>

            {/* Listers tab */}
            <TabsContent value="listers">
              <h2 className="mt-12 text-center text-2xl font-bold sm:text-3xl">
                {t("listers.why.title")}
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {([0, 1, 2, 3] as const).map((i) => (
                  <FeatureCard
                    key={i}
                    icon={listerWhyIcons[i]}
                    title={t(`listers.why.items.${i}.title`)}
                    description={t(`listers.why.items.${i}.description`)}
                  />
                ))}
              </div>

              <h2 className="mt-16 mb-12 text-center text-2xl font-bold sm:text-3xl">
                {t("listers.steps.title")}
              </h2>
              <StepList steps={listerSteps} icons={listerStepIcons} />

              {/* Share link */}
              <div className="mx-auto mt-16 max-w-2xl text-center">
                <Link2 className="mx-auto size-12 text-primary" />
                <h3 className="mt-4 text-2xl font-bold sm:text-3xl">
                  {t("listers.shareLink.title")}
                </h3>
                <p className="mt-4 text-muted-foreground">{t("listers.shareLink.description")}</p>
              </div>
            </TabsContent>
          </Tabs>
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
