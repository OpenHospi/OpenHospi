import type { Locale } from "@openhospi/i18n";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { AlertTriangle, Heart, User } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";

import { Button } from "@/components/ui/button";
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
    title: t("about.title"),
    description: t("about.description"),
    alternates: alternatesForPath(locale, "/about"),
  };
}

const sectionConfig: {
  key: "mission" | "crisis" | "builtBy" | "openSource";
  icon: ComponentType<SVGProps<SVGSVGElement> & { color?: string }>;
}[] = [
  { key: "mission", icon: Heart },
  { key: "crisis", icon: AlertTriangle },
  { key: "builtBy", icon: User },
  { key: "openSource", icon: SiGithub },
];

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const tSeo = await getTranslations({ locale, namespace: "seo.breadcrumbs" });

  // Safe: all content from our i18n translations, not user input
  const breadcrumbs = breadcrumbJsonLd(locale, [
    { name: tSeo("home"), path: "" },
    { name: t("title"), path: "/about" },
  ]);

  return (
    <section className="py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbs }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>

        <div className="mx-auto mt-16 max-w-3xl space-y-16">
          {sectionConfig.map(({ key, icon: Icon }) => (
            <div key={key}>
              <div className="flex items-center gap-3">
                <Icon className="size-6 text-primary" />
                <h2 className="text-2xl font-bold">{t(`${key}.title` as any)}</h2>
              </div>
              <p className="mt-4 text-muted-foreground">{t(`${key}.description` as any)}</p>
              {key === "openSource" && (
                <div className="mt-6">
                  <Button variant="outline" asChild>
                    <a
                      href="https://github.com/rubentalstra/OpenHospi"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SiGithub className="size-4" color="currentColor" />
                      {t("openSource.cta")}
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
